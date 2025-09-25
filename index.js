const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();
const bcrypt = require('bcrypt');

const DB_FILE = process.env.DB_FILE || './data/sequencia.db';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'troca_este_token_pelo_teu';

const db = new sqlite3.Database(DB_FILE);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// health
app.get('/', (req,res)=> res.json({ok:true}));

// login ou criação de colaborador
app.post('/login', async (req,res)=>{
  const {name, code, password} = req.body;
  if(!name || !code || !password) return res.status(400).json({error:'name, code, password required'});
  db.get('SELECT * FROM collaborators WHERE code = ?', [code], async (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row){
      const hash = await bcrypt.hash(password,10);
      db.run('INSERT INTO collaborators (name, code, password) VALUES (?,?,?)',[name,code,hash],function(err2){
        if(err2) return res.status(500).json({error:err2.message});
        return res.json({ok:true, name, code});
      });
    } else {
      const match = await bcrypt.compare(password, row.password || '');
      if(match) return res.json({ok:true, name: row.name, code: row.code});
      return res.status(401).json({error:'invalid credentials'});
    }
  });
});

// criar registo
app.post('/registos', (req,res)=>{
  const { collaborator_code, date, start_time, end_time, break_duration, deploys, collects, km_start, km_end, observations } = req.body;
  if(!collaborator_code || !date) return res.status(400).json({error:'collaborator_code and date required'});
  db.get('SELECT id FROM collaborators WHERE code = ?', [collaborator_code], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'colaborador nao encontrado'});
    db.run(
      `INSERT INTO registers (collaborator_id, date, start_time, end_time, break_duration, deploys, collects, km_start, km_end, observations)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [row.id, date, start_time, end_time, break_duration||0, deploys||0, collects||0, km_start||0, km_end||0, observations||null],
      function(err2){
        if(err2) return res.status(500).json({error:err2.message});
        db.get('SELECT * FROM registers WHERE id = ?', [this.lastID], (er,reg)=>{
          if(er) return res.status(500).json({error:er.message});
          res.json(reg);
        });
      }
    );
  });
});

// obter registos (admin)
app.get('/registos', (req,res)=>{
  const token = req.header('x-admin-token') || '';
  if(token !== ADMIN_TOKEN) return res.status(401).json({error:'unauthorized'});
  const {month, collaborator_code} = req.query;
  let sql = `SELECT r.*, c.name as collaborator_name, c.code as collaborator_code
             FROM registers r
             JOIN collaborators c ON c.id = r.collaborator_id`;
  let params = [];
  if(month || collaborator_code){
    sql += ' WHERE ';
    const clauses = [];
    if(month){
      clauses.push("substr(r.date,1,7) = ?");
      params.push(month);
    }
    if(collaborator_code){
      clauses.push("c.code = ?");
      params.push(collaborator_code);
    }
    sql += clauses.join(' AND ');
  }
  sql += ' ORDER BY r.date DESC, r.created_at DESC';
  db.all(sql, params, (err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('Backend running on',PORT));
