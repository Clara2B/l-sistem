const router = require('express').Router();
const { getConfig, updateConfig } = require('../controllers/configController');
const { authMiddleware, donoOnly } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', getConfig);
router.put('/', donoOnly, updateConfig);

module.exports = router;
