const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Listar todos os projetos de palmilhas do usuário
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, pat.name as patient_name 
       FROM insole_projects p 
       JOIN patients pat ON p.patient_id = pat.id 
       WHERE pat.user_id = ? 
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar projetos:', err);
    res.status(500).json({ error: 'Erro ao carregar projetos de palmilhas.' });
  }
});

// Detalhes completos de um projeto com seus componentes ortopédicos
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const projRes = await query('SELECT * FROM insole_projects WHERE id = ?', [id]);
    if (projRes.rows.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado.' });
    }

    const project = projRes.rows[0];
    const compRes = await query('SELECT * FROM insole_components WHERE insole_project_id = ?', [id]);

    let scan = null;
    if (project.foot_scan_id) {
      const scanRes = await query('SELECT * FROM foot_scans WHERE id = ?', [project.foot_scan_id]);
      if (scanRes.rows.length > 0) scan = scanRes.rows[0];
    }

    res.json({
      ...project,
      foot_scan: scan,
      components: compRes.rows
    });
  } catch (err) {
    console.error('Erro ao buscar projeto:', err);
    res.status(500).json({ error: 'Erro ao carregar detalhes do projeto.' });
  }
});

// Criar ou atualizar projeto de palmilha com seus componentes
router.post('/', async (req, res) => {
  const {
    id,
    patient_id,
    foot_scan_id,
    project_name,
    base_thickness,
    arch_height,
    arch_width,
    status,
    exported_file_path,
    components
  } = req.body;

  if (!patient_id) {
    return res.status(400).json({ error: 'ID do paciente é obrigatório.' });
  }

  try {
    let projectId = id;
    if (projectId) {
      // Atualizar projeto existente
      await query(
        `UPDATE insole_projects SET 
          project_name = ?, base_thickness = ?, arch_height = ?, arch_width = ?, 
          status = ?, exported_file_path = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          project_name || 'Nova Palmilha',
          base_thickness || 5.0,
          arch_height || 10.0,
          arch_width || 25.0,
          status || 'Em Edição',
          exported_file_path || '',
          projectId
        ]
      );
    } else {
      // Inserir novo projeto
      const resProj = await query(
        `INSERT INTO insole_projects 
          (foot_scan_id, patient_id, project_name, base_thickness, arch_height, arch_width, status, exported_file_path) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          foot_scan_id || null,
          patient_id,
          project_name || 'Nova Palmilha Ortopédica',
          base_thickness || 5.0,
          arch_height || 10.0,
          arch_width || 25.0,
          status || 'Em Edição',
          exported_file_path || ''
        ]
      );
      projectId = resProj.lastID || (resProj.rows && resProj.rows[0] ? resProj.rows[0].id : null);
    }

    // Salvar/atualizar lista de componentes se enviada
    if (Array.isArray(components)) {
      // Deletar componentes antigos e reinserir
      await query('DELETE FROM insole_components WHERE insole_project_id = ?', [projectId]);
      for (const comp of components) {
        await query(
          `INSERT INTO insole_components 
            (insole_project_id, component_type, position_x, position_y, position_z, height, width, depth, material_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId,
            comp.component_type || 'amortecedor_calcaneo',
            comp.position_x || 0,
            comp.position_y || 0,
            comp.position_z || 0,
            comp.height || 5,
            comp.width || 20,
            comp.depth || 20,
            comp.material_type || 'TPU Soft'
          ]
        );
      }
    }

    // Retornar o projeto salvo completo
    const saved = await query('SELECT * FROM insole_projects WHERE id = ?', [projectId]);
    const compsSaved = await query('SELECT * FROM insole_components WHERE insole_project_id = ?', [projectId]);

    res.json({
      ...saved.rows[0],
      components: compsSaved.rows
    });
  } catch (err) {
    console.error('Erro ao salvar projeto:', err);
    res.status(500).json({ error: 'Erro ao salvar projeto de palmilha.' });
  }
});

// Excluir projeto
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM insole_components WHERE insole_project_id = ?', [id]);
    await query('DELETE FROM insole_projects WHERE id = ?', [id]);
    res.json({ success: true, message: 'Projeto de palmilha excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir projeto:', err);
    res.status(500).json({ error: 'Erro ao excluir projeto.' });
  }
});

module.exports = router;
