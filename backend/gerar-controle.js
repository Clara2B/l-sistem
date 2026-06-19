/**
 * Gera planilha de controle com todas as empresas e usuários.
 *
 * COMO USAR:
 *   1. Pegue o DATABASE_URL no painel do Render:
 *      Render Dashboard → seu banco PostgreSQL → Connect → "External Connection String"
 *
 *   2. Execute:
 *      $env:DATABASE_URL="postgresql://usuario:senha@host.render.com/banco" ; node gerar-controle.js
 *
 *      Ou edite o .env com a URL de produção e rode: node gerar-controle.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.includes('localhost')) {
  console.error('\n❌ Configure o DATABASE_URL com a URL de produção do Render.');
  console.error('   Render Dashboard → PostgreSQL → Connect → External Connection String\n');
  console.error('   Execute:');
  console.error('   $env:DATABASE_URL="postgresql://..." ; node gerar-controle.js\n');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function gerarPlanilha() {
  try {
    console.log('🔌 Conectando ao banco de produção...');
    const { rows: empresas } = await pool.query(`
      SELECT id, nome, tipo_operacao, criado_em FROM empresas ORDER BY criado_em
    `);
    const { rows: usuarios } = await pool.query(`
      SELECT u.id, u.nome, u.email, u.tipo, u.criado_em, e.nome as empresa_nome
      FROM usuarios u JOIN empresas e ON u.empresa_id = e.id
      ORDER BY e.nome, u.tipo, u.nome
    `);

    const wb = XLSX.utils.book_new();
    const tipoOpLabel = { vendas: 'Apenas Vendas', recrutamento: 'Apenas Recrutamento', vendas_recrutamento: 'Vendas + Recrutamento' };
    const tipoUserLabel = { dono: 'Dono (admin)', rh: 'RH', vendedor: 'Vendedor' };

    // ── Aba 1: Empresas ──
    const empData = [
      ['EMPRESAS CADASTRADAS', '', '', '', ''],
      [`Gerado em: ${new Date().toLocaleString('pt-BR')}`, '', '', '', ''],
      ['', '', '', '', ''],
      ['Nome', 'Tipo de Operação', 'Senha da Empresa', 'Cadastrada em', 'Observação'],
      ...empresas.map(e => [
        e.nome,
        tipoOpLabel[e.tipo_operacao] || e.tipo_operacao,
        e.nome === 'Demo' ? 'demo123' : '(definida pelo cliente)',
        new Date(e.criado_em).toLocaleDateString('pt-BR'),
        e.nome === 'Demo' ? 'Empresa de demonstração' : '',
      ]),
    ];
    const wsEmp = XLSX.utils.aoa_to_sheet(empData);
    wsEmp['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 28 }];
    XLSX.utils.book_append_sheet(wb, wsEmp, 'Empresas');

    // ── Aba 2: Usuários ──
    const usrData = [
      ['USUÁRIOS CADASTRADOS', '', '', '', '', ''],
      [`Gerado em: ${new Date().toLocaleString('pt-BR')}`, '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Empresa', 'Nome', 'Email', 'Tipo', 'Senha', 'Cadastrado em'],
      ...usuarios.map(u => [
        u.empresa_nome,
        u.nome,
        u.email,
        tipoUserLabel[u.tipo] || u.tipo,
        u.empresa_nome === 'Demo' && u.tipo === 'dono' ? 'dono123' : '(definida pelo cliente)',
        new Date(u.criado_em).toLocaleDateString('pt-BR'),
      ]),
    ];
    const wsUsr = XLSX.utils.aoa_to_sheet(usrData);
    wsUsr['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 32 }, { wch: 16 }, { wch: 24 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsUsr, 'Usuários');

    // ── Aba 3: Resumo ──
    const resumoData = [
      ['RESUMO', ''],
      ['', ''],
      ['Total de empresas', empresas.length],
      ['Total de usuários', usuarios.length],
      ['Donos', usuarios.filter(u => u.tipo === 'dono').length],
      ['Vendedores', usuarios.filter(u => u.tipo === 'vendedor').length],
      ['RH', usuarios.filter(u => u.tipo === 'rh').length],
      ['', ''],
      ['Gerado em', new Date().toLocaleString('pt-BR')],
      ['', ''],
      ['AVISO', 'Senhas de clientes não são armazenadas em texto simples. Consulte seus registros manuais para senhas de empresas e usuários cadastrados fora do Demo.'],
    ];
    const wsRes = XLSX.utils.aoa_to_sheet(resumoData);
    wsRes['!cols'] = [{ wch: 22 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumo');

    const outputPath = path.join('C:\\Users\\elite\\L.SISTEM', 'controle-empresas.xlsx');
    XLSX.writeFile(wb, outputPath);
    console.log(`\n✅ Planilha gerada: ${outputPath}`);
    console.log(`📊 ${empresas.length} empresa(s) | ${usuarios.length} usuário(s)\n`);
  } catch (e) {
    console.error('❌ Erro:', e.message);
  } finally {
    await pool.end();
  }
}

gerarPlanilha();
