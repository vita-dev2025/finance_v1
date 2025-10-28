require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Importar rotas
const periodosRoutes = require('./backend/routes/periodos');
const transacoesRoutes = require('./backend/routes/transacoes');
const tiposTransacoesRoutes = require('./backend/routes/tipos-transacoes');

// Usar rotas
app.use('/api/periodos', periodosRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/tipos-transacoes', tiposTransacoesRoutes);

// Servir arquivos estáticos
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/transacoes', (req, res) => {
  res.sendFile(path.join(__dirname, 'transacoes.html'));
});

// Rota de health check para o Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Finance API está rodando' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Finance rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`💳 Transações: http://localhost:${PORT}/transacoes`);
});