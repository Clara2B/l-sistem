const router = require('express').Router();
const { listarLeads, buscarLead, criarLead, editarLead, patchLead, removerLead } = require('../controllers/leadsController');
const { authMiddleware, donoOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', listarLeads);
router.get('/:id', buscarLead);
router.post('/', criarLead);
router.put('/:id', editarLead);
router.patch('/:id', patchLead);
router.delete('/:id', donoOnly, removerLead);

module.exports = router;
