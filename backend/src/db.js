const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let pgPool = null;
let sqliteDb = null;
let dbMode = 'sqlite'; // 'pg' or 'sqlite'

if (process.env.PGHOST || process.env.DATABASE_URL) {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'fisiofeet',
    });
    dbMode = 'pg';
    console.log('🔗 Tentando conexão com PostgreSQL...');
  } catch (err) {
    console.warn('⚠️ Falha ao configurar PostgreSQL, utilizando SQLite local como fallback:', err.message);
    dbMode = 'sqlite';
  }
}

if (dbMode === 'sqlite') {
  const dbPath = path.join(dataDir, 'fisiofeet.sqlite');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Erro ao abrir banco SQLite:', err.message);
    } else {
      console.log('✅ Banco de dados SQLite conectado em:', dbPath);
    }
  });
}

// Inicializar esquemas das tabelas conforme especificação
function initDb() {
  const sqlInit = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY ${dbMode === 'pg' ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY ${dbMode === 'pg' ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      user_id INTEGER REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      age INTEGER,
      foot_size VARCHAR(10),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS foot_scans (
      id INTEGER PRIMARY KEY ${dbMode === 'pg' ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      patient_id INTEGER REFERENCES patients(id),
      file_path VARCHAR(500),
      file_format VARCHAR(10),
      upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      file_size INTEGER
    );

    CREATE TABLE IF NOT EXISTS insole_projects (
      id INTEGER PRIMARY KEY ${dbMode === 'pg' ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      foot_scan_id INTEGER REFERENCES foot_scans(id),
      patient_id INTEGER REFERENCES patients(id),
      project_name VARCHAR(255),
      base_thickness DECIMAL(5,2),
      arch_height DECIMAL(5,2),
      arch_width DECIMAL(5,2),
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      exported_file_path VARCHAR(500)
    );

    CREATE TABLE IF NOT EXISTS insole_components (
      id INTEGER PRIMARY KEY ${dbMode === 'pg' ? 'GENERATED ALWAYS AS IDENTITY' : 'AUTOINCREMENT'},
      insole_project_id INTEGER REFERENCES insole_projects(id),
      component_type VARCHAR(100),
      position_x DECIMAL(10,2),
      position_y DECIMAL(10,2),
      position_z DECIMAL(10,2),
      height DECIMAL(5,2),
      width DECIMAL(5,2),
      depth DECIMAL(5,2),
      material_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  if (dbMode === 'pg' && pgPool) {
    pgPool.query(sqlInit)
      .then(() => console.log('✅ Tabelas inicializadas no PostgreSQL.'))
      .catch(err => {
        console.warn('⚠️ Erro ao inicializar PostgreSQL, caindo de volta para SQLite:', err.message);
        dbMode = 'sqlite';
        const dbPath = path.join(dataDir, 'fisiofeet.sqlite');
        sqliteDb = new sqlite3.Database(dbPath);
        initDb();
      });
  } else if (sqliteDb) {
    sqliteDb.exec(sqlInit, (err) => {
      if (err) console.error('❌ Erro ao criar tabelas no SQLite:', err);
      else console.log('✅ Tabelas inicializadas no SQLite.');
    });
  }
}

// Abstração genérica de Query (suporta async/await tanto para pg quanto sqlite)
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (dbMode === 'pg' && pgPool) {
      // Converter marcadores ? do SQLite para $1, $2 do PG se necessário
      let pgSql = sql;
      let count = 1;
      while (pgSql.includes('?')) {
        pgSql = pgSql.replace('?', `$${count++}`);
      }
      pgPool.query(pgSql, params)
        .then(res => resolve({ rows: res.rows, rowCount: res.rowCount }))
        .catch(reject);
    } else if (sqliteDb) {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT')) {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows, rowCount: rows.length });
        });
      } else {
        sqliteDb.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ rows: [], lastID: this.lastID, changes: this.changes });
        });
      }
    } else {
      reject(new Error('Nenhum banco de dados configurado.'));
    }
  });
}

initDb();

module.exports = { query, getDbMode: () => dbMode };
