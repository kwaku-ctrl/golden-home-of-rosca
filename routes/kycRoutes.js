const express = require('express');
const kycController = require('../controllers/kycController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const router = express.Router();

router.use(protect);
router.post('/', upload.single('document'), kycController.uploadKyc);
router.get('/', kycController.getKycDocuments);
router.patch('/:id', restrictTo('admin', 'super-admin'), kycController.updateKycStatus);
router.delete('/:id', restrictTo('admin', 'super-admin'), kycController.deleteKyc);

module.exports = router;
