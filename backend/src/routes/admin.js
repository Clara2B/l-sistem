const router = require('express').Router();
const { authMiddleware, donoOnly } = require('../middleware/auth');
const XLSX = require('xlsx');
const { pool } = require('../database/db');

router.use(authMiddleware, donoOnly);

// Apenas o dono da empresa Demo (ou qualquer dono) pode exportar usuários da própria empresa
router.get('/exportar-usuarios', async (req, res, next) => {
  try {
    const { empresa_id } = req.user;

    const [{ rows: usuarios }, { rows: empresa }] = await Promise.all([
      pool.query(`
        SELECT u.nome, u.email, u.tipo, u.criado_em
        FROM usuarios u WHERE u.empresa_id = $1 ORDER BY u.tipo, u.nome
      `, [empresa_id]),
      pool.query('SELECT nome, tipo_operacao FROM empresas WHERE id = $1', [empresa_id]),
    ]);

    const tipoLabel = { dono: 'Dono (admin)', rh: 'RH', vendedor: 'Vendedor' };
    const tipoOp = { vendas: 'Apenas Vendas', recrutamento: 'Apenas Recrutamento', vendas_recrutamento: 'Vendas + Recrutamento' };
    const emp = empresa[0];

    const wb = XLSX.utils.book_new();

    const usrData = [
      [`USUÁRIOS — ${emp.nome}`, '', '', '', ''],
      [`Tipo de operação: ${tipoOp[emp.tipo_operacao] || emp.tipo_operacao}`, '', '', '', ''],
      ['', '', '', '', ''],
      ['Nome', 'Email', 'Tipo', 'Cadastrado em', 'Observação'],
      ...usuarios.map(u => [
        u.nome,
        u.email,
        tipoLabel[u.tipo] || u.tipo,
        new Date(u.criado_em).toLocaleDateString('pt-BR'),
        'Senha não exibida por segurança',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(usrData);
    ws['!cols'] = [{ wch: 24 }, { wch: 32 }, { wch: 16 }, { wch: 16 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `usuarios-${emp.nome.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
