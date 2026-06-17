const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

async function loginEmpresa(req, res) {
  const { nome, senha } = req.body;
  if (!nome || !senha) return res.status(400).json({ error: 'Nome e senha obrigatórios' });

  const { rows } = await pool.query('SELECT * FROM empresas WHERE nome = $1', [nome]);
  const empresa = rows[0];
  if (!empresa || !bcrypt.compareSync(senha, empresa.senha_hash)) {
    return res.status(401).json({ error: 'Empresa ou senha inválidos' });
  }

  const token = jwt.sign({ empresa_id: empresa.id, nome: empresa.nome, etapa: 'empresa' }, JWT_SECRET, { expiresIn: '4h' });
  res.json({ token, empresa: { id: empresa.id, nome: empresa.nome } });
}

async function loginUsuario(req, res) {
  const { email, senha } = req.body;
  const empresaToken = req.user;

  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios' });

  const { rows } = await pool.query('SELECT * FROM usuarios WHERE empresa_id = $1 AND email = $2', [empresaToken.empresa_id, email]);
  const usuario = rows[0];
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }

  const token = jwt.sign({
    empresa_id: usuario.empresa_id,
    user_id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
    etapa: 'usuario'
  }, JWT_SECRET, { expiresIn: '8h' });

  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo }
  });
}

async function registrarEmpresa(req, res) {
  const { nome, senha, nomeAdmin, emailAdmin, senhaAdmin } = req.body;
  if (!nome || !senha || !nomeAdmin || !emailAdmin || !senhaAdmin) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const { rows: existe } = await pool.query('SELECT id FROM empresas WHERE nome = $1', [nome]);
  if (existe.length) return res.status(409).json({ error: 'Empresa já cadastrada' });

  const empresaId = uuidv4();
  const donoId = uuidv4();
  const senhaHash = bcrypt.hashSync(senha, 10);
  const senhaAdminHash = bcrypt.hashSync(senhaAdmin, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO empresas (id, nome, senha_hash) VALUES ($1, $2, $3)', [empresaId, nome, senhaHash]);
    await client.query('INSERT INTO usuarios (id, empresa_id, nome, email, senha_hash, tipo) VALUES ($1, $2, $3, $4, $5, $6)', [donoId, empresaId, nomeAdmin, emailAdmin, senhaAdminHash, 'dono']);
    await client.query('INSERT INTO configuracoes (id, empresa_id) VALUES ($1, $2)', [uuidv4(), empresaId]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  res.status(201).json({ message: 'Empresa cadastrada com sucesso', empresa_id: empresaId });
}

module.exports = { loginEmpresa, loginUsuario, registrarEmpresa };
