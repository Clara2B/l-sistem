const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      senha_hash TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('dono','funcionario')),
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
  `);

  // Seed empresa Demo se não existir
  const { rows } = await pool.query("SELECT id FROM empresas WHERE nome = 'Demo'");
  if (!rows.length) {
    const empresaId = uuidv4();
    const donoId = uuidv4();
    const senhaEmpresaHash = bcrypt.hashSync('demo123', 10);
    const senhaDonoHash = bcrypt.hashSync('dono123', 10);

    await pool.query('INSERT INTO empresas (id, nome, senha_hash) VALUES ($1, $2, $3)', [empresaId, 'Demo', senhaEmpresaHash]);
    await pool.query('INSERT INTO usuarios (id, empresa_id, nome, email, senha_hash, tipo) VALUES ($1, $2, $3, $4, $5, $6)', [donoId, empresaId, 'Administrador', 'dono@demo.com', senhaDonoHash, 'dono']);
    await pool.query('INSERT INTO configuracoes (id, empresa_id, valor_investido) VALUES ($1, $2, $3)', [uuidv4(), empresaId, 0]);
    console.log('✅ Empresa Demo criada | Email: dono@demo.com | Senha: dono123 | Empresa: Demo | Senha empresa: demo123');
  }

  console.log('📊 Banco de dados PostgreSQL conectado e pronto');
}

module.exports = { pool, initDB };
