const router = require('express').Router();
const { authMiddleware, rhOnly, donoOnly } = require('../middleware/auth');
const { getDashboardRecrutamento, updateRecrutamentoConfig } = require('../controllers/recrutamentoController');

router.use(authMiddleware);

router.get('/dashboard', rhOnly, (req, res, next) => getDashboardRecrutamento(req, res).catch(next));
router.put('/config', donoOnly, (req, res, next) => updateRecrutamentoConfig(req, res).catch(next));

module.exports = router;
