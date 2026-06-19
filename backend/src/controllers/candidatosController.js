const { pool } = require('../database/db');

async function listarCandidatos(req, res) {
  const { empresa_id } = req.user;
  const { status, canal } = req.query;

  let i = 1;
  let where = `WHERE empresa_id = $${i++}`;
  const params = [empresa_id];

  if (status) { where += ` AND status = $${i++}`; params.push(status); }
  if (canal)  { where += ` AND canal = $${i++}`;  params.push(canal); }

  const { rows } = await pool.query(
    `SELECT * FROM candidatos ${where} ORDER BY criado_em DESC`,
    params
  );
  res.json(rows);
}

async function patchCandidato(req, res) {
  const { empresa_id } = req.user;
  const { id } = req.params;
  const allowed = ['status', 'canal', 'nome', 'telefone', 'email', 'cargo'];

  const sets = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      values.push(req.body[key]);
    }
  }

  if (!sets.length) return res.status(400).json({ error: 'Nada para atualizar' });
  sets.push('atualizado_em = NOW()');
  values.push(id, empresa_id);

  const { rowCount } = await pool.query(
    `UPDATE candidatos SET ${sets.join(', ')} WHERE id = $${i++} AND empresa_id = $${i++}`,
    values
  );
  if (!rowCount) return res.status(404).json({ error: 'Candidato não encontrado' });
  res.json({ message: 'Atualizado' });
}

async function removerCandidato(req, res) {
  const { empresa_id } = req.user;
  const { id } = req.params;
  const { rowCount } = await pool.query(
    'DELETE FROM candidatos WHERE id = $1 AND empresa_id = $2',
    [id, empresa_id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Candidato não encontrado' });
  res.json({ message: 'Removido' });
}

module.exports = { listarCandidatos, patchCandidato, removerCandidato };
