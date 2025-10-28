const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET últimos 5 períodos
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT * FROM tbl_periodos 
      WHERE dt_fechamento <= CURRENT_DATE OR dt_abertura <= CURRENT_DATE
      ORDER BY dt_inicio DESC 
      LIMIT 5
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar períodos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET período por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM tbl_periodos WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Período não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar período:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;