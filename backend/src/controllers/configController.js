const bcrypt = require('bcryptjs');
const { pool } = require('../database/db');

async function getConfig(req, res) {
  const { empresa_id } = req.user;
  const [empresaRes, configRes, recruRes] = await Promise.all([
    pool.query('SELECT id, nome, tipo_operacao, criado_em FROM empresas WHERE id = $1', [empresa_id]),
    pool.query('SELECT * FROM configuracoes WHERE empresa_id = $1', [empresa_id]),
    pool.query('SELECT * FROM recrutamento_config WHERE empresa_id = $1', [empresa_id]),
  ]);
  res.json({
    empresa: empresaRes.rows[0],
    config: configRes.rows[0],
    recrutamento: recruRes.rows[0] || null,
  });
}

async function updateConfig(req, res) {
  const { empresa_id } = req.user;
  const { valor_investido, nome_empresa, senha_empresa, tipo_operacao } = req.body;

  if (valor_investido !== undefined) {
    await pool.query(
      'UPDATE configuracoes SET valor_investido = $1, atualizado_em = NOW() WHERE empresa_id = $2',
      [+valor_investido, empresa_id]
    );
  }

  if (nome_empresa) {
    const { rows } = await pool.query('SELECT id FROM empresas WHERE nome = $1 AND id != $2', [nome_empresa, empresa_id]);
    if (rows.length) return res.status(409).json({ error: 'Nome de empresa já em uso' });
    await pool.query('UPDATE empresas SET nome = $1 WHERE id = $2', [nome_empresa, empresa_id]);
  }

  if (senha_empresa) {
    const hash = bcrypt.hashSync(senha_empresa, 10);
    await pool.query('UPDATE empresas SET senha_hash = $1 WHERE id = $2', [hash, empresa_id]);
  }

  if (tipo_operacao && ['vendas', 'recrutamento', 'vendas_recrutamento'].includes(tipo_operacao)) {
    await pool.query('UPDATE empresas SET tipo_operacao = $1 WHERE id = $2', [tipo_operacao, empresa_id]);
  }

  res.json({ message: 'Configurações atualizadas' });
}

module.exports = { getConfig, updateConfig };
