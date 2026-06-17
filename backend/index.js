require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./src/database/db');

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL || '*')
  : true;

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de erro assíncrono global
app.use((req, res, next) => {
  res.asyncHandler = fn => Promise.resolve(fn()).catch(next);
  next();
});

app.use('/api/auth',          require('./src/routes/auth'));
app.use('/api/leads',         require('./src/routes/leads'));
app.use('/api/usuarios',      require('./src/routes/users'));
app.use('/api/dashboard',     require('./src/routes/dashboard'));
app.use('/api/importar',      require('./src/routes/import'));
app.use('/api/configuracoes', require('./src/routes/config'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Tratamento de erros globais (inclui erros de async/await sem try-catch)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

start();
