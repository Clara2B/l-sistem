const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', getDashboard);

module.exports = router;
