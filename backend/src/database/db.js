const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  // Cria todas as tabelas (novas e existentes)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      tipo_operacao TEXT NOT NULL DEFAULT 'vendas',
      criado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      senha_hash TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'vendedor',
      criado_em TIMESTAMP DEFAULT NOW(),
      UNIQUE(empresa_id, email)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
      vendedor_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
      nome TEXT NOT NULL,
      parcela TEXT,
      endereco TEXT,
      email TEXT,
      telefone TEXT,
      status TEXT NOT NULL DEFAULT 'negociacao' CHECK(status IN ('negociacao','nao_atende','descarte','venda')),
      valor NUMERIC,
      criado_em TIMESTAMP DEFAULT NOW(),
      atualizado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id) ON DELETE CASCADE,
      valor_investido NUMERIC DEFAULT 0,
      atualizado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS candidatos (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      cargo TEXT,
      canal TEXT DEFAULT 'whatsapp' CHECK(canal IN ('whatsapp','linkedin')),
      status TEXT NOT NULL DEFAULT 'novo_contato' CHECK(status IN ('novo_contato','em_analise','entrevistado','aprovado','reprovado')),
      criado_em TIMESTAMP DEFAULT NOW(),
      atualizado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS recrutamento_config (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL UNIQUE REFERENCES empresas(id) ON DELETE CASCADE,
      budget NUMERIC DEFAULT 0,
      verba_utilizada NUMERIC DEFAULT 0,
      projecao_1 NUMERIC DEFAULT 80,
      projecao_2 NUMERIC DEFAULT 150,
      projecao_3 NUMERIC DEFAULT 300,
      atualizado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS credenciais_admin (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL,
      referencia_id TEXT NOT NULL,
      empresa_nome TEXT,
      nome TEXT,
      login TEXT NOT NULL,
      senha TEXT NOT NULL,
      atualizado_em TIMESTAMP DEFAULT NOW()
    );
  `);

  // Migração v2: atualiza bancos existentes, limpa dados antigos, re-seed Demo
  const { rows: migCheck } = await pool.query("SELECT value FROM system_config WHERE key = 'migration_v2'");
  if (!migCheck.length) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Adiciona colunas novas em tabelas existentes
      await client.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS tipo_operacao TEXT NOT NULL DEFAULT 'vendas'`);

      // Corrige constraint de tipo de usuário
      await client.query(`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_check`);
      await client.query(`UPDATE usuarios SET tipo = 'vendedor' WHERE tipo = 'funcionario'`);
      await client.query(`ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_check CHECK(tipo IN ('dono','rh','vendedor'))`);

      // Apaga todos os dados existentes (solicitado pelo usuário)
      await client.query(`TRUNCATE empresas CASCADE`);

      // Re-seed Demo
      const { empresaId, donoId, SENHA_EMPRESA, SENHA_DONO } = await seedDemo(client);

      await client.query("INSERT INTO system_config (key, value) VALUES ('migration_v2', 'done')");
      await client.query('COMMIT');

      console.log('✅ Migration v2 concluída | Dados antigos removidos | Demo recriado');
      gerarCredenciaisXLSX(SENHA_EMPRESA, SENHA_DONO);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // Seed Demo se não existir (banco totalmente novo)
  const { rows: emp } = await pool.query("SELECT id FROM empresas WHERE nome = 'Demo'");
  if (!emp.length) {
    const { SENHA_EMPRESA, SENHA_DONO } = await seedDemo(pool);
    gerarCredenciaisXLSX(SENHA_EMPRESA, SENHA_DONO);
  }

  console.log('📊 Banco de dados PostgreSQL conectado e pronto');
}

async function seedDemo(client) {
  const empresaId = uuidv4();
  const donoId = uuidv4();
  const SENHA_EMPRESA = 'demo123';
  const SENHA_DONO = 'dono123';

  await client.query(
    'INSERT INTO empresas (id, nome, senha_hash, tipo_operacao) VALUES ($1, $2, $3, $4)',
    [empresaId, 'Demo', bcrypt.hashSync(SENHA_EMPRESA, 10), 'vendas_recrutamento']
  );
  await client.query(
    'INSERT INTO usuarios (id, empresa_id, nome, email, senha_hash, tipo) VALUES ($1, $2, $3, $4, $5, $6)',
    [donoId, empresaId, 'Administrador', 'dono@demo.com', bcrypt.hashSync(SENHA_DONO, 10), 'dono']
  );
  await client.query(
    'INSERT INTO configuracoes (id, empresa_id, valor_investido) VALUES ($1, $2, $3)',
    [uuidv4(), empresaId, 0]
  );
  await client.query(
    'INSERT INTO recrutamento_config (id, empresa_id) VALUES ($1, $2)',
    [uuidv4(), empresaId]
  );
  // Salva credenciais em texto para acesso admin
  await client.query(
    `INSERT INTO credenciais_admin (id, tipo, referencia_id, empresa_nome, nome, login, senha)
     VALUES ($1,'empresa',$2,'Demo','Demo','Demo',$3)
     ON CONFLICT DO NOTHING`,
    [uuidv4(), empresaId, SENHA_EMPRESA]
  );
  await client.query(
    `INSERT INTO credenciais_admin (id, tipo, referencia_id, empresa_nome, nome, login, senha)
     VALUES ($1,'usuario',$2,'Demo','Administrador','dono@demo.com',$3)
     ON CONFLICT DO NOTHING`,
    [uuidv4(), donoId, SENHA_DONO]
  );

  console.log(`✅ Demo: empresa="Demo" senha="${SENHA_EMPRESA}" | email="${'dono@demo.com'}" senha="${SENHA_DONO}"`);
  return { empresaId, donoId, SENHA_EMPRESA, SENHA_DONO };
}

function gerarCredenciaisXLSX(SENHA_EMPRESA, SENHA_DONO) {
  try {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const wb = XLSX.utils.book_new();
    const data = [
      ['SISTEMA L.SISTEM / B.BOTH — CREDENCIAIS DE ACESSO', '', '', ''],
      ['', '', '', ''],
      ['EMPRESA DEMO', '', '', ''],
      ['Tipo', 'Login / Email', 'Senha', 'Observação'],
      ['Empresa (passo 1)', 'Demo', SENHA_EMPRESA, 'Digite no campo "Nome da empresa"'],
      ['Dono / Admin (passo 2)', 'dono@demo.com', SENHA_DONO, 'Acesso completo ao sistema'],
      ['', '', '', ''],
      ['NOVAS EMPRESAS', '', '', ''],
      ['Tipo', 'Login / Email', 'Senha', 'Observação'],
      ['Empresa', '(definida no cadastro)', '(definida no cadastro)', 'Nome escolhido ao registrar'],
      ['Usuários', '(definido pelo dono)', '(definido pelo dono)', 'Criados na aba Usuários'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 28 }, { wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Credenciais');

    XLSX.writeFile(wb, path.join(uploadsDir, 'credenciais_demo.xlsx'));
    console.log('📄 Planilha de credenciais gerada: uploads/credenciais_demo.xlsx');
  } catch (e) {
    console.error('Aviso: não foi possível gerar planilha de credenciais:', e.message);
  }
}

module.exports = { pool, initDB };
