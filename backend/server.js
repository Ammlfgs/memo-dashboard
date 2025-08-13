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
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  try { return JSON.parse(raw); } 
  catch { fs.writeFileSync(DATA_FILE, '[]', 'utf-8'); return []; }
}
function saveMemos(memos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2), 'utf-8');
}

// Ensure unique ids
(function ensureIds() {
  const memos = readMemos();
  let changed = false;
  for (let m of memos) if (!m.id) { m.id = `${Date.now()}-${Math.floor(Math.random()*10000)}`; changed=true; }
  if (changed) saveMemos(memos);
})();

// Parse memo date+time
function parseMemoDate(memo) {
  try {
    const iso = `${memo.date || ''}T${memo.time || '00:00'}`;
    const d = new Date(iso);
    if (isNaN(d)) return new Date(0);
    return d;
  } catch { return new Date(0); }
}

// Markets list
const MARKETS = [
  "Apo ZoneA","Area1 shopping complex","Area 2 shopping complex","Area 10 market",
  "Area 3 market","Dei Dei Markets","Garki International Market","Garki Model Market",
  "Gudu Market","Head Office","Kado Fish Market","Kaura Market","Maitama Farmers Market",
  "Wuse Market","Zone 3 neighnourhood center"
];

// GET all memos (newest first)
app.get('/api/memos', (req,res)=>{
  const memos = readMemos().slice().sort((a,b)=>parseMemoDate(b)-parseMemoDate(a));
  res.json(memos);
});

// POST add memo
app.post('/api/memos', (req,res)=>{
  const { title, description, date, time, status, market, direction } = req.body;
  if (!title||!description||!date||!time||!status||!market||!direction)
    return res.status(400).json({message:'All fields required'});
  if (!MARKETS.includes(market)) return res.status(400).json({message:'Invalid market'});
  
  const memos = readMemos();
  const newMemo = { id:`${Date.now()}-${Math.floor(Math.random()*10000)}`, title, description, date, time, status, market, direction };
  memos.push(newMemo);
  saveMemos(memos);
  res.status(201).json(newMemo);
});

// DELETE memo by id
app.delete('/api/memos/:id',(req,res)=>{
  const id = req.params.id;
  let memos = readMemos();
  const lenBefore = memos.length;
  memos = memos.filter(m=>String(m.id)!==String(id));
  if (memos.length===lenBefore) return res.status(404).json({message:'Memo not found'});
  saveMemos(memos);
  res.json({message:'Memo deleted'});
});

// PUT update memo
app.put('/api/memos/:id',(req,res)=>{
  const id=req.params.id;
  let memos = readMemos();
  const idx = memos.findIndex(m=>String(m.id)===String(id));
  if(idx===-1) return res.status(404).json({message:'Memo not found'});

  const { title, description, date, time, status, market, direction } = req.body;
  if (!title||!description||!date||!time||!status||!market||!direction)
    return res.status(400).json({message:'All fields required'});
  if (!MARKETS.includes(market)) return res.status(400).json({message:'Invalid market'});
  if(!['Incoming','Outgoing'].includes(direction)) return res.status(400).json({message:'Invalid direction'});

  memos[idx]={...memos[idx],title,description,date,time,status,market,direction};
  saveMemos(memos);
  res.json({message:'Memo updated', memo:memos[idx]});
});

// GET market counts
app.get('/api/markets/counts',(req,res)=>{
  const memos = readMemos();
  const result={};
  MARKETS.forEach(m=>result[m]={total:0,approved:0,pending:0});
  memos.forEach(m=>{
    if(m.market && result[m.market]!==undefined){
      result[m.market].total++;
      const s = String(m.status||'').toLowerCase();
      if(s==='approved') result[m.market].approved++;
      else if(s==='pending') result[m.market].pending++;
    }
  });
  res.json(result);
});

app.listen(PORT,()=>console.log(`🚀 Server running at http://localhost:${PORT}`));
