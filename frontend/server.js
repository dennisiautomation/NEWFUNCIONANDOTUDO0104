const express = require('express');
const path = require('path');
const app = express();
const PORT = 3002;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'build')));

// Rota principal que retorna o HTML principal
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor frontend rodando na porta ${PORT}`);
});
