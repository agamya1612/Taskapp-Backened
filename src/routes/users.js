
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');

router.get('/me', auth, userController.me);
router.put('/me', auth, userController.updateMe);

module.exports = router;
