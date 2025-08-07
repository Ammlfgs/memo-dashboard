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

// Initialize memos.json if missing
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

// Get all memos
app.get('/api/memos', (req, res) => {
  const memos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  res.json(memos);
});

// Add a memo
app.post('/api/memos', (req, res) => {
  const memos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  memos.push(req.body);
  fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2));
  res.status(201).json({ message: 'Memo added' });
});

// Delete memo by index
app.delete('/api/memos/:index', (req, res) => {
  const index = parseInt(req.params.index, 10);
  let memos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  if (index < 0 || index >= memos.length) {
    return res.status(400).json({ message: 'Invalid memo index' });
  }

  memos.splice(index, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2));
  res.json({ message: 'Memo deleted' });
});

// Get counts per market by status
app.get('/api/markets/counts', (req, res) => {
  const memos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
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
    "Zone 3 neighnourhood center"
  ];

  const result = {};
  marketsList.forEach(market => {
    result[market] = { total: 0, approved: 0, pending: 0 };
  });

  memos.forEach(memo => {
    if (result[memo.market]) {
      result[memo.market].total++;
      const statusLower = memo.status.toLowerCase();
      if (statusLower === 'approved') {
        result[memo.market].approved++;
      } else if (statusLower === 'pending') {
        result[memo.market].pending++;
      }
    }
  });

  res.json(result);
});

// Serve index.html as root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve markets.html
app.get('/markets.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/markets.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
