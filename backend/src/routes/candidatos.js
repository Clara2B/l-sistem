const router = require('express').Router();
const { authMiddleware, rhOnly } = require('../middleware/auth');
const { listarCandidatos, patchCandidato, removerCandidato } = require('../controllers/candidatosController');

router.use(authMiddleware);

router.get('/', rhOnly, (req, res, next) => listarCandidatos(req, res).catch(next));
router.patch('/:id', rhOnly, (req, res, next) => patchCandidato(req, res).catch(next));
router.delete('/:id', (req, res, next) => removerCandidato(req, res).catch(next));

module.exports = router;
