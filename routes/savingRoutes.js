const express = require('express');
const savingController = require('../controllers/savingController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect);
router.post('/', savingController.createSaving);
router.get('/', savingController.getSavings);
router.get('/:id', savingController.getSaving);
router.patch('/:id', restrictTo('admin', 'super-admin'), savingController.updateSaving);
router.delete('/:id', restrictTo('admin', 'super-admin'), savingController.deleteSaving);

module.exports = router;
