const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { previewImport, confirmarImport } = require('../controllers/importController');
const { authMiddleware, donoOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) cb(null, true);
    else cb(new Error('Formato inválido. Use .xlsx, .xls ou .csv'));
  }
});

router.use(authMiddleware);
router.post('/preview', donoOnly, upload.single('planilha'), previewImport);
router.post('/confirmar', donoOnly, confirmarImport);

module.exports = router;
