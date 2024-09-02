const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/quizapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('Error connecting to MongoDB:', err));

// Quiz Result Schema
const resultSchema = new mongoose.Schema({
  username: String,
  score: Number,
  totalQuestions: Number,
  date: { type: Date, default: Date.now },
});

const Result = mongoose.model('Result', resultSchema);

// API route to save quiz results
app.post('/api/results', async (req, res) => {
  try {
    const { username, score, totalQuestions } = req.body;
    const newResult = new Result({ username, score, totalQuestions });
    await newResult.save();
    res.status(201).json({ message: 'Result saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving result', error });
  }
});

// API route to get all results
app.get('/api/results', async (req, res) => {
  try {
    const results = await Result.find();
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving results', error });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
