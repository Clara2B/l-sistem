const router = require('express').Router();
const { loginEmpresa, loginUsuario, registrarEmpresa } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Etapa 1: empresa
router.post('/empresa', loginEmpresa);

// Etapa 2: usuário (exige token da empresa)
router.post('/usuario', authMiddleware, loginUsuario);

// Registrar nova empresa (rota pública ou protegida por chave de admin)
router.post('/registrar', registrarEmpresa);

module.exports = router;
