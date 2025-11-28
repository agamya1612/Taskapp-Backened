
const Team = require('../models/Team');
const User = require('../models/User');
const Joi = require('joi');

exports.createTeam = async (req, res) => {
  const schema = Joi.object({ name: Joi.string().required(), description: Joi.string().allow('') });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const team = await Team.create({ name: value.name, description: value.description, createdBy: req.user._id, members: [req.user._id] });
  res.status(201).json(team);
};

exports.getTeams = async (req, res) => {
  const teams = await Team.find({ members: req.user._id });
  res.json(teams);
};

exports.getTeam = async (req, res) => {
  const team = await Team.findById(req.params.id).populate('members', 'name email');
  if (!team) return res.status(404).json({ message: 'Team not found' });
  res.json(team);
};

exports.invite = async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!team.members.includes(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (!team.members.includes(user._id)) {
    team.members.push(user._id);
    await team.save();
  }
  res.json(team);
};
