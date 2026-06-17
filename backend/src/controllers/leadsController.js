const { v4: uuidv4 } = require('uuid');
const { pool } = require('../database/db');

async function listarLeads(req, res) {
  const { empresa_id, tipo, user_id } = req.user;
  const { status, vendedor_id, busca, data_inicio, data_fim } = req.query;

  let i = 1;
  let sql = `
    SELECT l.*, u.nome as vendedor_nome
    FROM leads l
    LEFT JOIN usuarios u ON l.vendedor_id = u.id
    WHERE l.empresa_id = $${i++}
  `;
  const params = [empresa_id];

  if (tipo === 'funcionario') {
    sql += ` AND (l.vendedor_id = $${i++} OR l.vendedor_id IS NULL)`;
    params.push(user_id);
  }
  if (status)      { sql += ` AND l.status = $${i++}`;                                params.push(status); }
  if (vendedor_id) { sql += ` AND l.vendedor_id = $${i++}`;                           params.push(vendedor_id); }
  if (busca) {
    const b = `%${busca}%`;
    sql += ` AND (l.nome ILIKE $${i++} OR l.telefone ILIKE $${i++} OR l.email ILIKE $${i++})`;
    params.push(b, b, b);
  }
  if (data_inicio) { sql += ` AND l.criado_em >= $${i++}`;               params.push(data_inicio); }
  if (data_fim)    { sql += ` AND l.criado_em <= $${i++}`;               params.push(data_fim + ' 23:59:59'); }

  sql += ' ORDER BY l.criado_em DESC';

  const { rows } = await pool.query(sql, params);
  res.json(rows);
}

async function buscarLead(req, res) {
  const { empresa_id, tipo, user_id } = req.user;
  const { id } = req.params;

  const { rows } = await pool.query(`
    SELECT l.*, u.nome as vendedor_nome
    FROM leads l LEFT JOIN usuarios u ON l.vendedor_id = u.id
    WHERE l.id = $1 AND l.empresa_id = $2
  `, [id, empresa_id]);

  const lead = rows[0];
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
  if (tipo === 'funcionario' && lead.vendedor_id !== null && lead.vendedor_id !== user_id) {
    return res.status(403).json({ error: 'Sem permissão' });
  }
  res.json(lead);
}

async function criarLead(req, res) {
  const { empresa_id } = req.user;
  const { nome, parcela, endereco, email, telefone, status, valor, vendedor_id } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

  const id = uuidv4();
  await pool.query(`
    INSERT INTO leads (id, empresa_id, vendedor_id, nome, parcela, endereco, email, telefone, status, valor)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [id, empresa_id, vendedor_id || null, nome, parcela || null, endereco || null, email || null, telefone || null, status || 'negociacao', valor || null]);

  res.status(201).json({ id, nome });
}

async function editarLead(req, res) {
  const { empresa_id, tipo, user_id } = req.user;
  const { id } = req.params;

  const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1 AND empresa_id = $2', [id, empresa_id]);
  const lead = rows[0];
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
  if (tipo === 'funcionario' && lead.vendedor_id !== null && lead.vendedor_id !== user_id) {
    return res.status(403).json({ error: 'Sem permissão para editar este lead' });
  }

  const { nome, parcela, endereco, email, telefone, status, valor, vendedor_id } = req.body;

  let i = 1;
  const sets = ['atualizado_em = NOW()'];
  const values = [];

  if (nome      !== undefined) { sets.push(`nome = $${i++}`);      values.push(nome); }
  if (parcela   !== undefined) { sets.push(`parcela = $${i++}`);   values.push(parcela); }
  if (endereco  !== undefined) { sets.push(`endereco = $${i++}`);  values.push(endereco); }
  if (email     !== undefined) { sets.push(`email = $${i++}`);     values.push(email); }
  if (telefone  !== undefined) { sets.push(`telefone = $${i++}`);  values.push(telefone); }
  if (status    !== undefined) { sets.push(`status = $${i++}`);    values.push(status); }
  if (valor     !== undefined) { sets.push(`valor = $${i++}`);     values.push(valor); }
  if (vendedor_id !== undefined && tipo === 'dono') { sets.push(`vendedor_id = $${i++}`); values.push(vendedor_id); }

  values.push(id, empresa_id);
  await pool.query(`UPDATE leads SET ${sets.join(', ')} WHERE id = $${i++} AND empresa_id = $${i++}`, values);
  res.json({ message: 'Lead atualizado' });
}

const STATUS_VALIDOS = ['negociacao', 'nao_atende', 'descarte', 'venda'];

async function patchLead(req, res) {
  const { empresa_id, tipo, user_id } = req.user;
  const { id } = req.params;
  const { campo, valor: novoValor } = req.body;

  const CAMPOS_PERMITIDOS = ['status', 'vendedor_id', 'valor'];
  if (!campo || !CAMPOS_PERMITIDOS.includes(campo)) {
    return res.status(400).json({ error: `Campo inválido. Permitidos: ${CAMPOS_PERMITIDOS.join(', ')}` });
  }

  const { rows } = await pool.query('SELECT * FROM leads WHERE id = $1 AND empresa_id = $2', [id, empresa_id]);
  const lead = rows[0];
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

  if (tipo === 'funcionario' && lead.vendedor_id !== null && lead.vendedor_id !== user_id) {
    return res.status(403).json({ error: 'Sem permissão para editar este lead' });
  }

  if (campo === 'status') {
    if (!STATUS_VALIDOS.includes(novoValor)) return res.status(400).json({ error: 'Status inválido' });
  }

  if (campo === 'vendedor_id') {
    if (tipo !== 'dono') return res.status(403).json({ error: 'Apenas o dono pode alterar o vendedor' });
    if (novoValor !== null && novoValor !== '') {
      const { rows: v } = await pool.query('SELECT id FROM usuarios WHERE id = $1 AND empresa_id = $2', [novoValor, empresa_id]);
      if (!v.length) return res.status(400).json({ error: 'Vendedor não pertence a esta empresa' });
    }
  }

  if (campo === 'valor') {
    if (novoValor !== null && novoValor !== '' && isNaN(Number(novoValor))) {
      return res.status(400).json({ error: 'Valor inválido' });
    }
  }

  let valorSalvar;
  if (campo === 'vendedor_id') {
    valorSalvar = (novoValor === '' || novoValor === null) ? null : novoValor;
  } else if (campo === 'valor') {
    valorSalvar = (novoValor === '' || novoValor === null) ? null : Number(novoValor);
  } else {
    valorSalvar = novoValor;
  }

  await pool.query(
    `UPDATE leads SET ${campo} = $1, atualizado_em = NOW() WHERE id = $2 AND empresa_id = $3`,
    [valorSalvar, id, empresa_id]
  );

  const { rows: updated } = await pool.query(`
    SELECT l.*, u.nome as vendedor_nome
    FROM leads l LEFT JOIN usuarios u ON l.vendedor_id = u.id
    WHERE l.id = $1 AND l.empresa_id = $2
  `, [id, empresa_id]);

  res.json(updated[0]);
}

async function removerLead(req, res) {
  const { empresa_id } = req.user;
  const { id } = req.params;
  const { rowCount } = await pool.query('DELETE FROM leads WHERE id = $1 AND empresa_id = $2', [id, empresa_id]);
  if (!rowCount) return res.status(404).json({ error: 'Lead não encontrado' });
  res.json({ message: 'Lead removido' });
}

module.exports = { listarLeads, buscarLead, criarLead, editarLead, patchLead, removerLead };
