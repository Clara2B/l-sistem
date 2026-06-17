const router = require('express').Router();
const { listarUsuarios, criarUsuario, editarUsuario, removerUsuario } = require('../controllers/usersController');
const { authMiddleware, donoOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', listarUsuarios);
router.post('/', donoOnly, criarUsuario);
router.put('/:id', donoOnly, editarUsuario);
router.delete('/:id', donoOnly, removerUsuario);

module.exports = router;
