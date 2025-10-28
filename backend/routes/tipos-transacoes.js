const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET tipos de transação por tipo
router.get('/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    const query = 'SELECT * FROM tbl_tp_transacoes WHERE tp_trans = $1 ORDER BY nm_trans';
    const result = await pool.query(query, [tipo.toUpperCase()]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar tipos de transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;