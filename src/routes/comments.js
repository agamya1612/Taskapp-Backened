
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const commentController = require('../controllers/commentController');

router.post('/:id', auth, commentController.uploadMiddleware, commentController.addComment);
router.get('/:id', auth, commentController.listComments);

module.exports = router;
