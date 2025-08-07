const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, '../data/memos.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper: read memos
function readMemos() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Helper: save memos
function saveMemos(memos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2), 'utf-8');
}

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve markets.html
app.get('/markets', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/markets.html'));
});

// API: Add memo
app.post('/api/memos', (req, res) => {
  const { title, description, date, time, status, market } = req.body;

  if (!title || !description || !date || !time || !status || !market) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const memos = readMemos();
  const newMemo = {
    id: Date.now(),
    title,
    description,
    date,
    time,
    status,
    market,
  };
  memos.push(newMemo);
  saveMemos(memos);

  res.json(newMemo);
});

// API: Get all memos
app.get('/api/memos', (req, res) => {
  const memos = readMemos();
  res.json(memos);
});

// API: Delete a memo by id
app.delete('/api/memos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let memos = readMemos();
  const initialLength = memos.length;
  memos = memos.filter(m => m.id !== id);
  if (memos.length === initialLength) {
    return res.status(404).json({ error: 'Memo not found' });
  }
  saveMemos(memos);
  res.json({ success: true });
});

// API: Get memo counts per market
app.get('/api/markets', (req, res) => {
  const memos = readMemos();
  const marketsList = [
    "Apo ZoneA",
    "Area1 shopping complex",
    "Area 2 shopping complex",
    "Area 10 market",
    "Area 3 market",
    "Dei Dei Markets",
    "Garki International Market",
    "Garki Model Market",
    "Gudu Market",
    "Head Office",
    "Kado Fish Market",
    "Kaura Market",
    "Maitama Farmers Market",
    "Wuse Market",
    "Zone 3 neighnourhood center",
  ];

  const counts = {};
  marketsList.forEach(m => counts[m] = 0);

  memos.forEach(memo => {
    if (counts[memo.market] !== undefined) {
      counts[memo.market]++;
    }
  });

  res.json(counts);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
