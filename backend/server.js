const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, '../data/memos.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

// Get all memos
app.get('/api/memos', (req, res) => {
  const memos = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(memos);
});

// Add new memo
app.post('/api/memos', (req, res) => {
  const memos = JSON.parse(fs.readFileSync(DATA_FILE));
  memos.push(req.body);
  fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2));
  res.status(201).json({ message: 'Memo added' });
});

// Delete memo by index
app.delete('/api/memos/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  let memos = JSON.parse(fs.readFileSync(DATA_FILE));

  if (index < 0 || index >= memos.length) {
    return res.status(400).json({ message: 'Invalid memo index' });
  }

  memos.splice(index, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2));
  res.json({ message: 'Memo deleted' });
});

// Update memo by index (Edit functionality)
app.put('/api/memos/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  let memos = JSON.parse(fs.readFileSync(DATA_FILE));

  if (index < 0 || index >= memos.length) {
    return res.status(400).json({ message: 'Invalid memo index' });
  }

  const { title, description, date, time, status, market } = req.body;
  if (!title || !description || !date || !time || !status || !market) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  memos[index] = { ...memos[index], title, description, date, time, status, market };
  fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2));
  res.json({ message: 'Memo updated' });
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
