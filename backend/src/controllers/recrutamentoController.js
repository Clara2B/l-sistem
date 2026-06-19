const { v4: uuidv4 } = require('uuid');
const { pool } = require('../database/db');

async function ensureConfig(empresa_id) {
  const { rows } = await pool.query('SELECT * FROM recrutamento_config WHERE empresa_id = $1', [empresa_id]);
  if (rows.length) return rows[0];
  await pool.query('INSERT INTO recrutamento_config (id, empresa_id) VALUES ($1, $2)', [uuidv4(), empresa_id]);
  const { rows: r2 } = await pool.query('SELECT * FROM recrutamento_config WHERE empresa_id = $1', [empresa_id]);
  return r2[0];
}

async function getDashboardRecrutamento(req, res) {
  const { empresa_id } = req.user;

  const config = await ensureConfig(empresa_id);

  const [totalRes, porStatusRes, porCanalRes] = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM candidatos WHERE empresa_id = $1', [empresa_id]),
    pool.query('SELECT status, COUNT(*) as count FROM candidatos WHERE empresa_id = $1 GROUP BY status', [empresa_id]),
    pool.query('SELECT canal, COUNT(*) as count FROM candidatos WHERE empresa_id = $1 GROUP BY canal', [empresa_id]),
  ]);

  const total = parseInt(totalRes.rows[0].count);
  const budget = parseFloat(config.budget || 0);
  const verba = parseFloat(config.verba_utilizada || 0);
  const custoConversa = total > 0 ? verba / total : 0;

  const statusMap = { novo_contato: 0, em_analise: 0, entrevistado: 0, aprovado: 0, reprovado: 0 };
  porStatusRes.rows.forEach(r => { statusMap[r.status] = parseInt(r.count); });

  const canalMap = { whatsapp: 0, linkedin: 0 };
  porCanalRes.rows.forEach(r => { if (r.canal) canalMap[r.canal] = parseInt(r.count); });

  const p1 = parseFloat(config.projecao_1 || 0);
  const p2 = parseFloat(config.projecao_2 || 0);
  const p3 = parseFloat(config.projecao_3 || 0);

  res.json({
    config: {
      budget,
      verba_utilizada: verba,
      saldo: budget - verba,
      utilizacao_pct: budget > 0 ? +((verba / budget) * 100).toFixed(1) : 0,
      projecao_1: p1,
      projecao_2: p2,
      projecao_3: p3,
    },
    resumo: {
      total_candidatos: total,
      custo_por_conversa: +custoConversa.toFixed(2),
      ...statusMap,
    },
    funil: canalMap,
    projecoes: {
      p1_candidatos: custoConversa > 0 && p1 > 0 ? Math.floor(p1 / custoConversa) : 0,
      p2_candidatos: custoConversa > 0 && p2 > 0 ? Math.floor(p2 / custoConversa) : 0,
      p3_candidatos: custoConversa > 0 && p3 > 0 ? Math.floor(p3 / custoConversa) : 0,
    },
  });
}

async function updateRecrutamentoConfig(req, res) {
  const { empresa_id } = req.user;
  await ensureConfig(empresa_id);

  const { budget, verba_utilizada, projecao_1, projecao_2, projecao_3 } = req.body;
  const sets = [];
  const vals = [];
  let i = 1;

  if (budget !== undefined)          { sets.push(`budget = $${i++}`);           vals.push(+budget); }
  if (verba_utilizada !== undefined)  { sets.push(`verba_utilizada = $${i++}`);  vals.push(+verba_utilizada); }
  if (projecao_1 !== undefined)       { sets.push(`projecao_1 = $${i++}`);       vals.push(+projecao_1); }
  if (projecao_2 !== undefined)       { sets.push(`projecao_2 = $${i++}`);       vals.push(+projecao_2); }
  if (projecao_3 !== undefined)       { sets.push(`projecao_3 = $${i++}`);       vals.push(+projecao_3); }

  if (!sets.length) return res.status(400).json({ error: 'Nada para atualizar' });
  sets.push('atualizado_em = NOW()');
  vals.push(empresa_id);

  await pool.query(
    `UPDATE recrutamento_config SET ${sets.join(', ')} WHERE empresa_id = $${i++}`,
    vals
  );
  res.json({ message: 'Configurações de recrutamento atualizadas' });
}

module.exports = { getDashboardRecrutamento, updateRecrutamentoConfig };
