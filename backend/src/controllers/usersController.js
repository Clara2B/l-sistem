const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../database/db');

const TIPOS_VALIDOS = ['dono', 'rh', 'vendedor'];

async function listarUsuarios(req, res) {
  const { empresa_id } = req.user;
  const { rows } = await pool.query(
    'SELECT id, nome, email, tipo, criado_em FROM usuarios WHERE empresa_id = $1 ORDER BY criado_em',
    [empresa_id]
  );
  res.json(rows);
}

async function criarUsuario(req, res) {
  const { empresa_id } = req.user;
  const { nome, email, senha, tipo } = req.body;
  if (!nome || !email || !senha || !tipo) return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  if (!TIPOS_VALIDOS.includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' });

  const { rows: existe } = await pool.query('SELECT id FROM usuarios WHERE empresa_id = $1 AND email = $2', [empresa_id, email]);
  if (existe.length) return res.status(409).json({ error: 'Email já cadastrado nesta empresa' });

  const id = uuidv4();
  const senha_hash = bcrypt.hashSync(senha, 10);
  await pool.query(
    'INSERT INTO usuarios (id, empresa_id, nome, email, senha_hash, tipo) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, empresa_id, nome, email, senha_hash, tipo]
  );
  res.status(201).json({ id, nome, email, tipo });
}

async function editarUsuario(req, res) {
  const { empresa_id } = req.user;
  const { id } = req.params;
  const { nome, email, senha, tipo } = req.body;

  const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1 AND empresa_id = $2', [id, empresa_id]);
  if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });

  let i = 1;
  const sets = [];
  const values = [];

  if (nome)  { sets.push(`nome = $${i++}`);       values.push(nome); }
  if (email) { sets.push(`email = $${i++}`);      values.push(email); }
  if (tipo && TIPOS_VALIDOS.includes(tipo)) { sets.push(`tipo = $${i++}`); values.push(tipo); }
  if (senha) { sets.push(`senha_hash = $${i++}`); values.push(bcrypt.hashSync(senha, 10)); }

  if (!sets.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

  values.push(id, empresa_id);
  await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${i++} AND empresa_id = $${i++}`, values);
  res.json({ message: 'Usuário atualizado' });
}

async function removerUsuario(req, res) {
  const { empresa_id, user_id } = req.user;
  const { id } = req.params;

  if (id === user_id) return res.status(400).json({ error: 'Você não pode remover sua própria conta' });

  const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1 AND empresa_id = $2', [id, empresa_id]);
  if (!rowCount) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json({ message: 'Usuário removido' });
}

module.exports = { listarUsuarios, criarUsuario, editarUsuario, removerUsuario };
