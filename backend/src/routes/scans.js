const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'scans');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `foot_scan_${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Limite de 100MB por escaneamento
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.stl', '.obj', '.ply'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato inválido. Apenas arquivos 3D .stl, .obj ou .ply são permitidos.'));
    }
  }
});

router.use(authMiddleware);

// Upload de escaneamento 3D do pé com tratamento robusto de erros
router.post('/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error('Erro no upload de arquivo (Multer):', err.message);
      return res.status(400).json({ error: err.message || 'Erro ao processar o arquivo 3D.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo 3D foi selecionado.' });
    }

    const patient_id = req.body.patient_id;
    if (!patient_id) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'ID do paciente é obrigatório para associar o escaneamento.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const relativePath = `/uploads/scans/${req.file.filename}`;

    try {
      const result = await query(
        'INSERT INTO foot_scans (patient_id, file_path, file_format, file_size) VALUES (?, ?, ?, ?)',
        [patient_id, relativePath, ext, req.file.size]
      );

      const newId = result.lastID || (result.rows && result.rows[0] ? result.rows[0].id : null);
      const scan = await query('SELECT * FROM foot_scans WHERE id = ?', [newId]);

      console.log(`✅ Escaneamento 3D salvo com sucesso: ${req.file.filename} para paciente #${patient_id}`);
      res.status(201).json(scan.rows[0]);
    } catch (dbErr) {
      console.error('Erro ao salvar no banco de dados:', dbErr.message);
      res.status(500).json({ error: 'Erro ao registrar o escaneamento no banco de dados.' });
    }
  });
});

// Listar escaneamentos por paciente
router.get('/patient/:patientId', async (req, res) => {
  try {
    const scans = await query('SELECT * FROM foot_scans WHERE patient_id = ? ORDER BY upload_date DESC', [req.params.patientId]);
    res.json(scans.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar escaneamentos do paciente.' });
  }
});

module.exports = router;
