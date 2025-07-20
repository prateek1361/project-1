const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  name: String,
  email: String
}, { timestamps: true });

module.exports = mongoose.model('Agent', AgentSchema);
