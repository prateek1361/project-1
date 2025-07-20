const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: String,
  email: String,
  source: String,
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  priority: String,
  status: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  tags: { 
    type: [String]
  },
}, { timestamps: true });

module.exports = mongoose.model('Lead', LeadSchema);
