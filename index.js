const express = require('express');
const mongoose = require('mongoose');
const app = express();
const { initializeDatabase } = require("./db/db.connect");
const Lead = require('./models/Lead');
const Agent = require('./models/Agent')
const Comment = require('./models/Comment');
const Tag = require('./models/Tag');

app.use(express.json());

initializeDatabase();

const cors = require('cors');
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));




app.post('/leads', async (req, res) => {
  const lead = new Lead(req.body);
  await lead.save();
  res.status(201).json(lead);
});


app.get('/leads', async (req, res) => {
  const filter = {};
  if (req.query.assignedAgent) filter.assignedAgent = req.query.assignedAgent;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.priority) filter.priority = req.query.priority;
  const leads = await Lead.find(filter)
    .populate('assignedAgent').populate('comments')
  res.json(leads);
});

app.get('/leads/:leadId', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId)
      .populate('assignedAgent')
      .populate('comments');
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


app.patch('/leads/:leadId', async (req, res) => {
  const updated = await Lead.findByIdAndUpdate(
    req.params.leadId,
    req.body,
    { new: true }
  );
  res.json(updated);
});


app.delete('/leads/:leadId', async (req, res) => {
  await Lead.findByIdAndDelete(req.params.leadId);
  res.json({ message: "Deleted" });
});


app.post('/leads/:leadId/comments', async (req, res) => {
  const comment = new Comment({ ...req.body, lead: req.params.leadId });
  await comment.save();
  await Lead.findByIdAndUpdate(req.params.leadId, { $push: { comments: comment._id } });
  res.status(201).json(comment);
});

app.get('/leads/:leadId/comments', async (req, res) => {
  const lead = await Lead.findById(req.params.leadId).populate('comments');
  res.json(lead.comments);
});


app.post('/tags', async (req, res) => {
  const tag = new Tag(req.body);
  await tag.save();
  res.status(201).json(tag);
});


app.get('/tags', async (req, res) => {
  const tags = await Tag.find();
  res.json(tags);
});


app.patch('/leads/:leadId/tags', async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(
    req.params.leadId,
    { $addToSet: { tags: { $each: req.body.tags } } },
    { new: true }
  ).populate('tags');
  res.json(lead);
});


app.post('/agents', async (req, res) => {
  const agent = new Agent(req.body);
  await agent.save();
  res.status(201).json(agent);
});


app.get('/agents', async (req, res) => {
  const agents = await Agent.find();
  res.json(agents);
});


app.get('/reporting/pipeline', async (req, res) => {
  const stats = await Lead.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);
  res.json(stats);
});


app.get('/reporting/conversions', async (req, res) => {
  const totalNew = await Lead.countDocuments({ status: 'New' });
  const totalClosed = await Lead.countDocuments({ status: 'Closed' });
  const conversionRate = totalClosed && totalNew ? ((totalClosed / totalNew) * 100) : 0;
  res.json({ conversionRate });
});


app.get('/reporting/summary', async (req, res) => {
  const totalLeads = await Lead.countDocuments();
  const totalClosed = await Lead.countDocuments({ status: 'Closed' });
  res.json({ totalLeads, totalClosed });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
