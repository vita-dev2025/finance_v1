const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_l0fpWqZQJ5ht@ep-raspy-mouse-ahxuhhr7-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Testar a conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados Neon.tech');
});

pool.on('error', (err) => {
  console.error('❌ Erro na conexão com o banco:', err);
});

module.exports = pool;