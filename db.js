const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const DB_FILE = process.env.DB_FILE || './data/sequencia.db';
const MIGRATION = path.join(__dirname, 'migrations', 'init.sql');

if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

const db = new sqlite3.Database(DB_FILE);
const sql = fs.readFileSync(MIGRATION, 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('Erro a criar tabelas:', err);
    process.exit(1);
  } else {
    console.log('Tabelas criadas / já existentes.');
    process.exit(0);
  }
});
