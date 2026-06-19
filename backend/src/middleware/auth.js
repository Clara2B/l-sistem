const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'l_sistem_secret_key_2024';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function donoOnly(req, res, next) {
  if (req.user.tipo !== 'dono') {
    return res.status(403).json({ error: 'Acesso restrito ao dono da empresa' });
  }
  next();
}

function rhOnly(req, res, next) {
  if (req.user.tipo !== 'rh' && req.user.tipo !== 'dono') {
    return res.status(403).json({ error: 'Acesso restrito ao RH' });
  }
  next();
}

function vendedorOnly(req, res, next) {
  if (req.user.tipo !== 'vendedor' && req.user.tipo !== 'dono') {
    return res.status(403).json({ error: 'Acesso restrito a vendedores' });
  }
  next();
}

module.exports = { authMiddleware, donoOnly, rhOnly, vendedorOnly, JWT_SECRET };
