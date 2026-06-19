require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./src/database/db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',               require('./src/routes/auth'));
app.use('/api/leads',              require('./src/routes/leads'));
app.use('/api/usuarios',           require('./src/routes/users'));
app.use('/api/dashboard',          require('./src/routes/dashboard'));
app.use('/api/importar',           require('./src/routes/import'));
app.use('/api/configuracoes',      require('./src/routes/config'));
app.use('/api/candidatos',         require('./src/routes/candidatos'));
app.use('/api/admin',              require('./src/routes/admin'));
app.use('/api/recrutamento',       require('./src/routes/recrutamento'));
app.use('/api/importar-candidatos', require('./src/routes/importarCandidatos'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  }
}

start();
