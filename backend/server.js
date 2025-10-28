require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Rotas
app.use('/api/periodos', require('./routes/periodos'));
app.use('/api/transacoes', require('./routes/transacoes'));
app.use('/api/tipos-transacoes', require('./routes/tipos-transacoes'));

// Servir arquivos estáticos
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/transacoes', (req, res) => {
  res.sendFile(path.join(__dirname, '../transacoes.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});