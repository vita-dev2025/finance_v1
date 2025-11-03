const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rotas para servir as páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/transacoes', (req, res) => {
  res.sendFile(path.join(__dirname, 'transacoes.html'));
});

// API - Buscar períodos (CORRIGIDA)
app.get('/api/periodos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome_periodo, dt_abertura, dt_fechamento 
      FROM tbl_periodos 
      WHERE dt_fechamento >= CURRENT_DATE - INTERVAL '6 months'
        AND dt_abertura <= CURRENT_DATE
      ORDER BY dt_fechamento DESC 
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar períodos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API - Buscar transações por período
app.get('/api/transacoes/:periodoId', async (req, res) => {
  try {
    const { periodoId } = req.params;
    const result = await pool.query(`
      SELECT 
        t.id,
        t.tp_trans,
        t.valor_trans,
        t.dt_trans,
        t.status_trans,
        t.recorrencia_trans,
        t.forma_trans,
        t.desc_trans,
        tt.nm_trans,
        tt.cat_trans
      FROM tbl_transacoes t
      INNER JOIN tbl_tp_transacoes tt ON t.id_nome_trans = tt.id
      WHERE t.id_periodo = $1
      ORDER BY t.tp_trans, t.dt_trans DESC
    `, [periodoId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API - Buscar tipos de transação
app.get('/api/tipos-transacao/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    const result = await pool.query(
      'SELECT id, nm_trans, cat_trans FROM tbl_tp_transacoes WHERE tp_trans = $1',
      [tipo]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar tipos de transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API - Salvar transação
app.post('/api/transacoes', async (req, res) => {
  try {
    const {
      id_periodo,
      tp_trans,
      id_nome_trans,
      recorrencia_trans,
      valor_trans,
      dt_trans,
      forma_trans,
      desc_trans
    } = req.body;

    const result = await pool.query(`
      INSERT INTO tbl_transacoes (
        id_periodo, tp_trans, id_nome_trans, recorrencia_trans, 
        valor_trans, dt_trans, forma_trans, desc_trans, status_trans
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PREVISTO')
      RETURNING *
    `, [id_periodo, tp_trans, id_nome_trans, recorrencia_trans, valor_trans, dt_trans, forma_trans, desc_trans]);

    res.json({ success: true, transacao: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API - Atualizar transação
app.put('/api/transacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tp_trans,
      id_nome_trans,
      recorrencia_trans,
      valor_trans,
      dt_trans,
      status_trans,
      forma_trans,
      desc_trans
    } = req.body;

    const result = await pool.query(`
      UPDATE tbl_transacoes 
      SET tp_trans = $1, id_nome_trans = $2, recorrencia_trans = $3,
          valor_trans = $4, dt_trans = $5, status_trans = $6,
          forma_trans = $7, desc_trans = $8
      WHERE id = $9
      RETURNING *
    `, [tp_trans, id_nome_trans, recorrencia_trans, valor_trans, dt_trans, status_trans, forma_trans, desc_trans, id]);

    res.json({ success: true, transacao: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});