const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '../data/memos.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper to read/save memos
function readMemos() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse memos.json — resetting to []', e);
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
    return [];
  }
}
function saveMemos(memos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2), 'utf-8');
}

// Ensure every memo has a unique id (runs once on start)
(function ensureIds() {
  const memos = readMemos();
  let changed = false;
  for (let m of memos) {
    if (!m.id) {
      m.id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      changed = true;
    }
  }
  if (changed) saveMemos(memos);
})();

// Utility: parse combined date+time into a JS Date (fallback to epoch if invalid)
function parseMemoDate(memo) {
  try {
    const date = memo.date || '';
    const time = memo.time || '00:00';
    // Ensure time has seconds if not supplied
    const iso = `${date}T${time}`;
    const d = new Date(iso);
    if (isNaN(d)) return new Date(0);
    return d;
  } catch {
    return new Date(0);
  }
}

// Markets list (same as you provided)
const MARKETS = [
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

// GET /api/memos
// Return memos sorted by memo date (newest first)
app.get('/api/memos', (req, res) => {
  const memos = readMemos();
  const sorted = memos.slice().sort((a, b) => parseMemoDate(b) - parseMemoDate(a));
  res.json(sorted);
});

// POST /api/memos
app.post('/api/memos', (req, res) => {
  const { title, description, date, time, status, market, direction } = req.body;
  if (!title || !description || !date || !time || !status || !market || !direction) {
    return res.status(400).json({ message: 'All fields are required (title, description, date, time, status, market, direction).' });
  }
  if (!MARKETS.includes(market)) {
    return res.status(400).json({ message: 'Invalid market value.' });
  }
  const memos = readMemos();
  const newMemo = {
    id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    title,
    description,
    date,
    time,
    status,
    market,
    direction // 'Incoming' or 'Outgoing'
  };
  memos.push(newMemo);
  saveMemos(memos);
  res.status(201).json(newMemo);
});

// DELETE /api/memos/:id
app.delete('/api/memos/:id', (req, res) => {
  const id = req.params.id;
  let memos = readMemos();
  const initialLength = memos.length;
  memos = memos.filter(m => String(m.id) !== String(id));
  if (memos.length === initialLength) {
    return res.status(404).json({ message: 'Memo not found' });
  }
  saveMemos(memos);
  res.json({ message: 'Memo deleted' });
});

// PUT /api/memos/:id  -> update full memo (used by edit form)
app.put('/api/memos/:id', (req, res) => {
  const id = req.params.id;
  let memos = readMemos();
  const idx = memos.findIndex(m => String(m.id) === String(id));
  if (idx === -1) return res.status(404).json({ message: 'Memo not found' });

  const { title, description, date, time, status, market, direction } = req.body;
  if (!title || !description || !date || !time || !status || !market || !direction) {
    return res.status(400).json({ message: 'All fields are required (title, description, date, time, status, market, direction).' });
  }
  if (!MARKETS.includes(market)) return res.status(400).json({ message: 'Invalid market value.' });
  if (!['Incoming', 'Outgoing'].includes(direction)) return res.status(400).json({ message: 'Invalid direction value.' });

  memos[idx] = { ...memos[idx], title, description, date, time, status, market, direction };
  saveMemos(memos);
  res.json({ message: 'Memo updated', memo: memos[idx] });
});

// GET /api/markets/counts  -> counts per market (total / approved / pending)
app.get('/api/markets/counts', (req, res) => {
  const memos = readMemos();
  const result = {};
  MARKETS.forEach(m => result[m] = { total: 0, approved: 0, pending: 0 });

  memos.forEach(memo => {
    if (memo.market && result[memo.market] !== undefined) {
      result[memo.market].total++;
      const s = String(memo.status || '').toLowerCase();
      if (s === 'approved') result[memo.market].approved++;
      else if (s === 'pending') result[memo.market].pending++;
    }
  });

  res.json(result);
});

// serve index and static files handled by express.static above
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/markets.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/markets.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
