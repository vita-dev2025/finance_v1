const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET transações por período
router.get('/periodo/:periodoId', async (req, res) => {
  try {
    const { periodoId } = req.params;
    const query = `
      SELECT t.*, tp.nm_trans, tp.cat_trans 
      FROM tbl_transacoes t
      JOIN tbl_tp_transacoes tp ON t.id_nome_trans = tp.id
      WHERE t.id_periodo = $1
      ORDER BY t.dt_trans DESC
    `;
    const result = await pool.query(query, [periodoId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET transação por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT t.*, tp.nm_trans, tp.cat_trans, p.nome_periodo
      FROM tbl_transacoes t
      JOIN tbl_tp_transacoes tp ON t.id_nome_trans = tp.id
      JOIN tbl_periodos p ON t.id_periodo = p.id
      WHERE t.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST nova transação
router.post('/', async (req, res) => {
  try {
    const {
      id_periodo,
      tp_trans,
      id_nome_trans,
      recorrencia_trans,
      valor_trans,
      desc_trans,
      dt_trans,
      status_trans
    } = req.body;

    const query = `
      INSERT INTO tbl_transacoes (
        id_periodo, tp_trans, id_nome_trans, recorrencia_trans, 
        valor_trans, desc_trans, dt_trans, status_trans
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      id_periodo,
      tp_trans,
      id_nome_trans,
      recorrencia_trans,
      parseFloat(valor_trans),
      desc_trans,
      dt_trans,
      status_trans
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT atualizar transação
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tp_trans,
      id_nome_trans,
      recorrencia_trans,
      valor_trans,
      desc_trans,
      dt_trans,
      status_trans
    } = req.body;

    const query = `
      UPDATE tbl_transacoes 
      SET tp_trans = $1, id_nome_trans = $2, recorrencia_trans = $3,
          valor_trans = $4, desc_trans = $5, dt_trans = $6, status_trans = $7
      WHERE id = $8
      RETURNING *
    `;

    const values = [
      tp_trans,
      id_nome_trans,
      recorrencia_trans,
      parseFloat(valor_trans),
      desc_trans,
      dt_trans,
      status_trans,
      id
    ];

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;