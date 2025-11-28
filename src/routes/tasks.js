
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const multer = require('multer');

router.post('/', auth, taskController.createTask);
router.get('/', auth, taskController.listTasks);
router.get('/:id', auth, taskController.getTask);
router.patch('/:id', auth, taskController.updateTask);
router.post('/:id/assign', auth, taskController.assignTask);
router.post('/:id/complete', auth, taskController.markComplete);
router.post('/:id/attachments', auth, commentController.uploadMiddleware, async (req, res) => {
  const Attachment = require('../models/Attachment');
  const Task = require('../models/Task');
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const attach = await Attachment.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    uploadedBy: req.user._id
  });
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  task.attachments.push(attach._id);
  await task.save();
  res.status(201).json(attach);
});

module.exports = router;
