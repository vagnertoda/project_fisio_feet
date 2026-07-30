require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const scanRoutes = require('./routes/scans');
const projectRoutes = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(helmet({
  crossOriginResourcePolicy: false, // Permitir carregar arquivos 3D estáticos no Three.js
}));
app.use(cors());
app.use(express.json());

// Servir diretório de uploads estáticos para o Three.js acessar arquivos 3D
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/projects', projectRoutes);

// Endpoint de HealthCheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', service: 'FisioFeet Backend API', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor FisioFeet rodando na porta ${PORT}`);
  console.log(`📡 URL API: http://localhost:${PORT}/api`);
});
