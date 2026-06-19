const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../database/db');
const fs = require('fs');
const path = require('path');

function normalizeHeader(h) {
  return String(h).toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeCanal(v) {
  const s = String(v).toLowerCase().trim();
  if (['linkedin', 'ln', 'linked'].includes(s)) return 'linkedin';
  return 'whatsapp';
}

const CAMPOS_MAP = {
  'nome': 'nome', 'name': 'nome', 'candidato': 'nome',
  'telefone': 'telefone', 'celular': 'telefone', 'whatsapp': 'telefone', 'phone': 'telefone', 'contato': 'telefone',
  'email': 'email', 'emails': 'email',
  'cargo': 'cargo', 'funcao': 'cargo', 'vaga': 'cargo', 'position': 'cargo', 'role': 'cargo',
  'canal': 'canal', 'origem': 'canal', 'source': 'canal', 'plataforma': 'canal',
};

function previewImportCandidatos(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

  try {
    const wb = XLSX.readFile(req.file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rows.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Planilha vazia' });
    }

    const preview = rows.slice(0, 5).map(row => {
      const mapped = {};
      Object.entries(row).forEach(([k, v]) => {
        const campo = CAMPOS_MAP[normalizeHeader(k)];
        if (campo) mapped[campo] = String(v).trim();
      });
      if (mapped.canal) mapped.canal = normalizeCanal(mapped.canal);
      return mapped;
    });

    res.json({ total: rows.length, preview, arquivo: req.file.filename });
  } catch (e) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    res.status(400).json({ error: 'Erro ao ler planilha: ' + e.message });
  }
}

async function confirmarImportCandidatos(req, res) {
  const { empresa_id } = req.user;
  const { arquivo } = req.body;
  const filePath = path.join(__dirname, '..', '..', 'uploads', arquivo);

  if (!fs.existsSync(filePath)) return res.status(400).json({ error: 'Arquivo não encontrado' });

  try {
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    let importados = 0;
    let erros = 0;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        const mapped = {};
        Object.entries(row).forEach(([k, v]) => {
          const campo = CAMPOS_MAP[normalizeHeader(k)];
          if (campo) mapped[campo] = String(v).trim();
        });
        if (mapped.canal) mapped.canal = normalizeCanal(mapped.canal);
        if (!mapped.nome) { erros++; continue; }

        const canal = ['whatsapp', 'linkedin'].includes(mapped.canal) ? mapped.canal : 'whatsapp';

        try {
          await client.query(
            'INSERT INTO candidatos (id, empresa_id, nome, telefone, email, cargo, canal) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [uuidv4(), empresa_id, mapped.nome, mapped.telefone || null, mapped.email || null, mapped.cargo || null, canal]
          );
          importados++;
        } catch { erros++; }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    try { fs.unlinkSync(filePath); } catch {}
    res.json({ importados, erros, message: `${importados} candidatos importados com sucesso` });
  } catch (e) {
    res.status(500).json({ error: 'Erro na importação: ' + e.message });
  }
}

module.exports = { previewImportCandidatos, confirmarImportCandidatos };
