const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// GET - Listar períodos
router.get('/periodos', async (req, res) => {
    try {
        const query = `
            SELECT id, nome_periodo, dt_inicio, dt_fim, dt_abertura, dt_fechamento 
            FROM tbl_periodos 
            WHERE dt_fechamento >= CURRENT_DATE OR dt_abertura <= CURRENT_DATE
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

// GET - Listar transações por período
router.get('/transacoes/:periodoId', async (req, res) => {
    try {
        const { periodoId } = req.params;
        const query = `
            SELECT 
                t.id,
                t.tp_trans,
                t.id_nome_trans,
                t.recorrencia_trans,
                t.valor_trans,
                t.desc_trans,
                t.dt_trans,
                t.status_trans,
                tt.nm_trans,
                tt.cat_trans
            FROM tbl_transacoes t
            JOIN tbl_tp_transacoes tt ON t.id_nome_trans = tt.id
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

// GET - Listar tipos de transação
router.get('/tipos-transacao/:tipo', async (req, res) => {
    try {
        const { tipo } = req.params;
        const query = 'SELECT id, nm_trans, cat_trans FROM tbl_tp_transacoes WHERE tp_trans = $1';
        const result = await pool.query(query, [tipo]);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar tipos de transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT - Atualizar transação
router.put('/transacoes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { tp_trans, id_nome_trans, recorrencia_trans, valor_trans, dt_trans, status_trans, desc_trans } = req.body;
        
        const query = `
            UPDATE tbl_transacoes 
            SET tp_trans = $1, id_nome_trans = $2, recorrencia_trans = $3, 
                valor_trans = $4, dt_trans = $5, status_trans = $6, desc_trans = $7
            WHERE id = $8
        `;
        
        await pool.query(query, [
            tp_trans, id_nome_trans, recorrencia_trans, valor_trans, 
            dt_trans, status_trans, desc_trans, id
        ]);
        
        res.json({ message: 'Transação atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST - Criar nova transação
router.post('/transacoes', async (req, res) => {
    try {
        const { id_periodo, tp_trans, id_nome_trans, recorrencia_trans, valor_trans, dt_trans, status_trans, desc_trans } = req.body;
        
        const query = `
            INSERT INTO tbl_transacoes 
            (id_periodo, tp_trans, id_nome_trans, recorrencia_trans, valor_trans, dt_trans, status_trans, desc_trans)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        
        await pool.query(query, [
            id_periodo, tp_trans, id_nome_trans, recorrencia_trans, 
            valor_trans, dt_trans, status_trans, desc_trans
        ]);
        
        res.json({ message: 'Transação criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET - Dashboard data
router.get('/dashboard/:periodoId', async (req, res) => {
    try {
        const { periodoId } = req.params;
        
        const entradasQuery = `
            SELECT COALESCE(SUM(valor_trans), 0) as total
            FROM tbl_transacoes 
            WHERE id_periodo = $1 AND tp_trans = 'ENTRADA'
        `;
        
        const saidasQuery = `
            SELECT COALESCE(SUM(valor_trans), 0) as total
            FROM tbl_transacoes 
            WHERE id_periodo = $1 AND tp_trans = 'SAÍDA'
        `;
        
        const [entradasResult, saidasResult] = await Promise.all([
            pool.query(entradasQuery, [periodoId]),
            pool.query(saidasQuery, [periodoId])
        ]);
        
        const entradas = parseFloat(entradasResult.rows[0].total);
        const saidas = parseFloat(saidasResult.rows[0].total);
        const saldo = entradas - saidas;
        
        res.json({ entradas, saidas, saldo });
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;