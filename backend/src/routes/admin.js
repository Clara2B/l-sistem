const router = require('express').Router();
const { authMiddleware, donoOnly } = require('../middleware/auth');
const XLSX = require('xlsx');
const { pool } = require('../database/db');

const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

// ── Planilha geral protegida por chave secreta (apenas o dono do sistema) ──
router.get('/planilha-geral', async (req, res, next) => {
  const key = req.query.key || req.headers['x-admin-key'];
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const [{ rows: empresas }, { rows: usuarios }, { rows: creds }] = await Promise.all([
      pool.query('SELECT id, nome, tipo_operacao, criado_em FROM empresas ORDER BY criado_em'),
      pool.query(`
        SELECT u.id, u.nome, u.email, u.tipo, u.criado_em, e.nome AS empresa_nome
        FROM usuarios u JOIN empresas e ON u.empresa_id = e.id
        ORDER BY e.nome, u.tipo, u.nome
      `),
      pool.query('SELECT tipo, referencia_id, login, senha FROM credenciais_admin'),
    ]);

    const credMap = {};
    creds.forEach(c => { credMap[c.referencia_id] = { login: c.login, senha: c.senha }; });

    const tipoOpLabel   = { vendas: 'Apenas Vendas', recrutamento: 'Apenas Recrutamento', vendas_recrutamento: 'Vendas + Recrutamento' };
    const tipoUserLabel = { dono: 'Dono (admin)', rh: 'RH', vendedor: 'Vendedor' };
    const wb = XLSX.utils.book_new();

    // Aba 1 — Empresas
    const wsEmpData = [
      ['EMPRESAS CADASTRADAS', '', '', '', ''],
      [`Gerado em: ${new Date().toLocaleString('pt-BR')}`, '', '', '', ''],
      ['', '', '', '', ''],
      ['Nome da Empresa', 'Senha da Empresa', 'Tipo de Operação', 'Cadastrada em', 'Total Usuários'],
      ...empresas.map(e => [
        e.nome,
        credMap[e.id]?.senha || '(não registrada)',
        tipoOpLabel[e.tipo_operacao] || e.tipo_operacao,
        new Date(e.criado_em).toLocaleDateString('pt-BR'),
        usuarios.filter(u => u.empresa_nome === e.nome).length,
      ]),
    ];
    const wsEmp = XLSX.utils.aoa_to_sheet(wsEmpData);
    wsEmp['!cols'] = [{ wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsEmp, 'Empresas');

    // Aba 2 — Usuários
    const wsUsrData = [
      ['USUÁRIOS CADASTRADOS', '', '', '', '', ''],
      [`Gerado em: ${new Date().toLocaleString('pt-BR')}`, '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Empresa', 'Nome', 'Email', 'Senha', 'Tipo', 'Cadastrado em'],
      ...usuarios.map(u => [
        u.empresa_nome,
        u.nome,
        u.email,
        credMap[u.id]?.senha || '(não registrada)',
        tipoUserLabel[u.tipo] || u.tipo,
        new Date(u.criado_em).toLocaleDateString('pt-BR'),
      ]),
    ];
    const wsUsr = XLSX.utils.aoa_to_sheet(wsUsrData);
    wsUsr['!cols'] = [{ wch: 24 }, { wch: 24 }, { wch: 32 }, { wch: 20 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsUsr, 'Usuários');

    // Aba 3 — Resumo
    const wsResData = [
      ['RESUMO', ''],
      ['', ''],
      ['Total de empresas', empresas.length],
      ['Total de usuários', usuarios.length],
      ['Donos',      usuarios.filter(u => u.tipo === 'dono').length],
      ['Vendedores', usuarios.filter(u => u.tipo === 'vendedor').length],
      ['RH',         usuarios.filter(u => u.tipo === 'rh').length],
      ['', ''],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
    ];
    const wsRes = XLSX.utils.aoa_to_sheet(wsResData);
    wsRes['!cols'] = [{ wch: 22 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumo');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `controle-lsistem-${new Date().toISOString().slice(0,10)}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    next(e);
  }
});

// ── Exportar usuários da própria empresa (dono autenticado) ──
router.get('/exportar-usuarios', authMiddleware, donoOnly, async (req, res, next) => {
  try {
    const { empresa_id } = req.user;
    const [{ rows: usuarios }, { rows: empresa }] = await Promise.all([
      pool.query('SELECT nome, email, tipo, criado_em FROM usuarios WHERE empresa_id = $1 ORDER BY tipo, nome', [empresa_id]),
      pool.query('SELECT nome, tipo_operacao FROM empresas WHERE id = $1', [empresa_id]),
    ]);

    const tipoLabel = { dono: 'Dono (admin)', rh: 'RH', vendedor: 'Vendedor' };
    const tipoOp   = { vendas: 'Apenas Vendas', recrutamento: 'Apenas Recrutamento', vendas_recrutamento: 'Vendas + Recrutamento' };
    const emp = empresa[0];
    const wb = XLSX.utils.book_new();

    const wsData = [
      [`USUÁRIOS — ${emp.nome}`, '', '', ''],
      [`Operação: ${tipoOp[emp.tipo_operacao] || emp.tipo_operacao}`, '', '', ''],
      ['', '', '', ''],
      ['Nome', 'Email', 'Tipo', 'Cadastrado em'],
      ...usuarios.map(u => [u.nome, u.email, tipoLabel[u.tipo] || u.tipo, new Date(u.criado_em).toLocaleDateString('pt-BR')]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 24 }, { wch: 32 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="usuarios-${emp.nome.toLowerCase().replace(/\s+/g, '-')}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
