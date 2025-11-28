
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const teamController = require('../controllers/teamController');

router.post('/', auth, teamController.createTeam);
router.get('/', auth, teamController.getTeams);
router.get('/:id', auth, teamController.getTeam);
router.post('/:id/invite', auth, teamController.invite);

module.exports = router;
