const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Listar todos os pacientes do usuário
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const result = await query('SELECT * FROM patients WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar pacientes:', err);
    res.status(500).json({ error: 'Erro ao buscar pacientes.' });
  }
});

// Buscar paciente por ID com seus escaneamentos e projetos
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || 1;
  try {
    const patientRes = await query('SELECT * FROM patients WHERE id = ? AND user_id = ?', [id, userId]);
    if (patientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado.' });
    }

    const patient = patientRes.rows[0];
    const scansRes = await query('SELECT * FROM foot_scans WHERE patient_id = ? ORDER BY upload_date DESC', [id]);
    const projectsRes = await query('SELECT * FROM insole_projects WHERE patient_id = ? ORDER BY updated_at DESC', [id]);

    res.json({
      ...patient,
      scans: scansRes.rows,
      projects: projectsRes.rows
    });
  } catch (err) {
    console.error('Erro ao buscar paciente:', err);
    res.status(500).json({ error: 'Erro interno ao carregar paciente.' });
  }
});

// Cadastrar novo paciente com tratamento robusto de ID e busca de confirmação
router.post('/', async (req, res) => {
  const { name, age, foot_size, notes } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome do paciente é obrigatório.' });
  }

  const userId = req.user?.id || 1;

  try {
    const result = await query(
      'INSERT INTO patients (user_id, name, age, foot_size, notes) VALUES (?, ?, ?, ?, ?)',
      [
        userId,
        name.trim(),
        age ? parseInt(age) : null,
        foot_size ? foot_size.trim() : null,
        notes ? notes.trim() : ''
      ]
    );

    let newId = result.lastID || (result.rows && result.rows[0] ? result.rows[0].id : null);
    let newPatient = null;

    if (newId) {
      const fetched = await query('SELECT * FROM patients WHERE id = ?', [newId]);
      if (fetched.rows && fetched.rows.length > 0) {
        newPatient = fetched.rows[0];
      }
    }

    // Fallback: Buscar último paciente cadastrado pelo usuário
    if (!newPatient) {
      const fetched = await query('SELECT * FROM patients WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
      if (fetched.rows && fetched.rows.length > 0) {
        newPatient = fetched.rows[0];
      }
    }

    if (!newPatient) {
      return res.status(500).json({ error: 'Falha ao confirmar cadastro do paciente.' });
    }

    console.log(`✅ Paciente cadastrado com sucesso: ${newPatient.name} (ID: ${newPatient.id})`);
    res.status(201).json(newPatient);
  } catch (err) {
    console.error('Erro ao cadastrar paciente:', err.message);
    res.status(500).json({ error: 'Erro no servidor ao salvar paciente no banco de dados.' });
  }
});

// Atualizar paciente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, age, foot_size, notes } = req.body;
  const userId = req.user?.id || 1;

  try {
    await query(
      'UPDATE patients SET name = ?, age = ?, foot_size = ?, notes = ? WHERE id = ? AND user_id = ?',
      [name, age, foot_size, notes, id, userId]
    );

    const updated = await query('SELECT * FROM patients WHERE id = ?', [id]);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar paciente:', err);
    res.status(500).json({ error: 'Erro ao atualizar paciente.' });
  }
});

// Excluir paciente
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || 1;
  try {
    await query('DELETE FROM patients WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, message: 'Paciente excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir paciente:', err);
    res.status(500).json({ error: 'Erro ao excluir paciente.' });
  }
});

module.exports = router;
