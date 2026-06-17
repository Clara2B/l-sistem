const { pool } = require('../database/db');

async function getDashboard(req, res) {
  const { empresa_id } = req.user;
  const { data_inicio, data_fim, vendedor_id } = req.query;

  let i = 1;
  let whereBase = `WHERE empresa_id = $${i++}`;
  const params = [empresa_id];

  if (data_inicio) { whereBase += ` AND criado_em >= $${i++}`;                params.push(data_inicio); }
  if (data_fim)    { whereBase += ` AND criado_em <= $${i++}`;                params.push(data_fim + ' 23:59:59'); }
  if (vendedor_id) { whereBase += ` AND vendedor_id = $${i++}`;               params.push(vendedor_id); }

  const [totalRes, porStatusRes, configRes, evolucaoRes, porVendedorRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) as count FROM leads ${whereBase}`, params),
    pool.query(`SELECT status, COUNT(*) as count, COALESCE(SUM(valor), 0) as total_valor FROM leads ${whereBase} GROUP BY status`, params),
    pool.query('SELECT valor_investido FROM configuracoes WHERE empresa_id = $1', [empresa_id]),
    pool.query(`
      SELECT DATE(criado_em) as data, status, COUNT(*) as count
      FROM leads WHERE empresa_id = $1
      AND criado_em >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(criado_em), status
      ORDER BY data
    `, [empresa_id]),
    pool.query(`
      SELECT u.nome as vendedor, l.status, COUNT(*) as count
      FROM leads l
      LEFT JOIN usuarios u ON l.vendedor_id = u.id
      WHERE l.empresa_id = $1
      GROUP BY l.vendedor_id, u.nome, l.status
    `, [empresa_id]),
  ]);

  const total = parseInt(totalRes.rows[0].count);
  const statusMap = { negociacao: 0, nao_atende: 0, descarte: 0, venda: 0 };
  let totalVendas = 0;
  let qtdVendas = 0;

  porStatusRes.rows.forEach(row => {
    statusMap[row.status] = parseInt(row.count);
    if (row.status === 'venda') {
      totalVendas = parseFloat(row.total_valor);
      qtdVendas = parseInt(row.count);
    }
  });

  const valorInvestido = parseFloat(configRes.rows[0]?.valor_investido || 0);
  const cpl = total > 0 ? valorInvestido / total : 0;
  const cpv = qtdVendas > 0 ? valorInvestido / qtdVendas : 0;
  const taxaConversao = total > 0 ? (qtdVendas / total) * 100 : 0;
  const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;

  res.json({
    resumo: {
      total_leads: total,
      negociacao: statusMap.negociacao,
      nao_atende: statusMap.nao_atende,
      descarte: statusMap.descarte,
      vendas: qtdVendas,
      valor_investido: valorInvestido,
      total_vendido: totalVendas,
      cpl: +cpl.toFixed(2),
      cpv: +cpv.toFixed(2),
      taxa_conversao: +taxaConversao.toFixed(2),
      ticket_medio: +ticketMedio.toFixed(2),
    },
    evolucao: evolucaoRes.rows,
    por_vendedor: porVendedorRes.rows,
  });
}

module.exports = { getDashboard };
