import { useState, useEffect, useCallback } from 'react';
import { HeaderNav } from './components/UI/HeaderNav';
import { LeftSidebar } from './components/UI/LeftSidebar';
import { RightPropertyPanel } from './components/UI/RightPropertyPanel';
import { ViewportToolbar } from './components/UI/ViewportToolbar';
import { InsoleEditor3D } from './components/3d/InsoleEditor3D';
import {
  PatientModal,
  UploadScanModal,
  ExportTPUSummaryModal,
  LoginForm
} from './components/UI/Modals';
import type {
  Patient,
  FootScan,
  InsoleProject,
  OrthopedicComponent,
  OrthopedicComponentType,
  RenderMode,
  ViewpointPreset
} from './types/insole';
import { patientService, scanService, projectService, authService } from './services/api';

export function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('fisiofeet_token'));
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  // Estados do Paciente
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [scans, setScans] = useState<FootScan[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);

  // Estado do Projeto de Palmilha Ativo
  const [project, setProject] = useState<InsoleProject>({
    project_name: 'Palmilha Ortopédica Personalizada',
    foot_side: 'right',
    patient_id: 1,
    base_thickness: 5.0,
    arch_height: 16.0,
    arch_width: 25.0,
    status: 'Em Edição',
    components: [
      {
        id: 'comp-1',
        component_type: 'amortecedor_calcaneo',
        name: 'Amortecedor de Calcâneo',
        position_x: 0,
        position_y: 5.0,
        position_z: -80,
        height: 6.0,
        width: 45.0,
        depth: 45.0,
        material_type: 'TPU Soft (Shore 85A)',
        color: '#22c55e'
      },
      {
        id: 'comp-2',
        component_type: 'piloto_metatarso',
        name: 'Piloto Metatarsal',
        position_x: 0,
        position_y: 5.0,
        position_z: 35,
        height: 5.0,
        width: 32.0,
        depth: 25.0,
        material_type: 'TPU Medium (Shore 95A)',
        color: '#06b6d4'
      }
    ]
  });

  // Estados de Edição 3D
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [viewpoint, setViewpoint] = useState<ViewpointPreset>('perspective');
  const [showFoot, setShowFoot] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Estados dos Modais
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTPUSummaryOpen, setIsTPUSummaryOpen] = useState(false);

  // Carregar dados iniciais após Login
  const loadInitialData = useCallback(async () => {
    try {
      const pts = await patientService.getAll();
      setPatients(pts);

      if (pts.length > 0) {
        const firstPatient = pts[0];
        setCurrentPatient(firstPatient);
        const ptScans = await scanService.getByPatient(firstPatient.id);
        setScans(ptScans);
        setProject((prev) => ({ ...prev, patient_id: firstPatient.id }));
      } else {
        // Criar paciente demonstrativo padrão se nenhum existir
        const demoPatient = await patientService.create({
          name: 'Paciente Demonstração',
          age: 38,
          foot_size: 'BR 40',
          notes: 'Fascite plantar e pronação acentuada'
        });
        setPatients([demoPatient]);
        setCurrentPatient(demoPatient);
        setProject((prev) => ({ ...prev, patient_id: demoPatient.id }));
      }
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    }
  }, []);

  useEffect(() => {
    if (token) {
      setUser({ id: 1, username: 'fisioterapeuta' });
      loadInitialData();
    }
  }, [token, loadInitialData]);

  // Handler de Seleção de Paciente
  const handleSelectPatient = async (patientId: number) => {
    const pt = patients.find((p) => p.id === patientId) || null;
    setCurrentPatient(pt);
    if (pt) {
      const ptScans = await scanService.getByPatient(pt.id);
      setScans(ptScans);
      setSelectedScanId(null);
      setProject((prev) => ({ ...prev, patient_id: pt.id }));
    }
  };

  // Handler de Cadastro de Novo Paciente
  const handleCreatePatient = async (data: Partial<Patient>) => {
    try {
      const newPt = await patientService.create(data);
      if (!newPt || !newPt.id) {
        throw new Error('Servidor retornou um objeto inválido para o paciente.');
      }
      setPatients((prev) => [newPt, ...prev]);
      setCurrentPatient(newPt);
      setScans([]);
      setSelectedScanId(null);
      setProject((prev) => ({ ...prev, patient_id: newPt.id }));
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      throw err;
    }
  };

  // Handler de Upload de Escaneamento 3D
  const handleUploadScan = async (file: File) => {
    if (!currentPatient) {
      alert('Por favor, selecione ou cadastre um paciente antes de fazer o upload do escaneamento 3D.');
      return;
    }
    const newScan = await scanService.upload(currentPatient.id, file);
    setScans((prev) => [newScan, ...prev]);
    setSelectedScanId(newScan.id);
    setShowFoot(true);
    setProject((prev) => ({ ...prev, foot_scan_id: newScan.id }));
  };

  // Handlers da Palmilha Base
  const handleUpdateBaseThickness = (val: number) => {
    setProject((prev) => ({ ...prev, base_thickness: val }));
  };

  const handleUpdateArchHeight = (val: number) => {
    setProject((prev) => ({ ...prev, arch_height: val }));
  };

  const handleUpdateArchWidth = (val: number) => {
    setProject((prev) => ({ ...prev, arch_width: val }));
  };

  // Handlers dos Componentes Ortopédicos
  const handleAddComponent = (type: OrthopedicComponentType) => {
    const newId = `comp-${Date.now()}`;
    let name = 'Novo Componente';
    let color = '#22c55e';
    let height = 5;
    let width = 30;
    let depth = 30;
    let position_z = 0;

    switch (type) {
      case 'amortecedor_calcaneo':
        name = 'Amortecedor de Calcâneo';
        color = '#22c55e';
        height = 6;
        width = 45;
        depth = 45;
        position_z = -80;
        break;
      case 'piloto_metatarso':
        name = 'Piloto Metatarsal';
        color = '#06b6d4';
        height = 5;
        width = 32;
        depth = 25;
        position_z = 35;
        break;
      case 'cunha_pronacao':
        name = 'Cunha de Pronação (Medial)';
        color = '#3b82f6';
        height = 7;
        width = 25;
        depth = 60;
        position_z = -20;
        break;
      case 'cunha_supinacao':
        name = 'Cunha de Supinação (Lateral)';
        color = '#a855f7';
        height = 7;
        width = 25;
        depth = 60;
        position_z = -20;
        break;
      case 'estimulo_proprioceptivo':
        name = 'Estímulo Proprioceptivo';
        color = '#f59e0b';
        height = 4;
        width = 20;
        depth = 20;
        position_z = 10;
        break;
      case 'placa_pressao':
        name = 'Placa de Alívio de Pressão';
        color = '#ef4444';
        height = 3;
        width = 35;
        depth = 35;
        position_z = 50;
        break;
    }

    const newComp: OrthopedicComponent = {
      id: newId,
      component_type: type,
      name,
      position_x: 0,
      position_y: project.base_thickness,
      position_z,
      height,
      width,
      depth,
      material_type: 'TPU Soft (Shore 85A)',
      color
    };

    setProject((prev) => ({
      ...prev,
      components: [...prev.components, newComp]
    }));
    setSelectedComponentId(newId);
  };

  const handleDuplicateComponent = (id: string) => {
    const target = project.components.find((c) => c.id === id);
    if (!target) return;

    const dupId = `comp-${Date.now()}`;
    const dup: OrthopedicComponent = {
      ...target,
      id: dupId,
      name: `${target.name} (Cópia)`,
      position_x: target.position_x + 8,
      position_z: target.position_z + 8
    };

    setProject((prev) => ({
      ...prev,
      components: [...prev.components, dup]
    }));
    setSelectedComponentId(dupId);
  };

  const handleDeleteComponent = (id: string) => {
    setProject((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== id)
    }));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  };

  const handleUpdateComponent = (id: string, updates: Partial<OrthopedicComponent>) => {
    setProject((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, ...updates } : c))
    }));
  };

  const handleUpdateComponentPosition = (id: string, pos: { x: number; y: number; z: number }) => {
    setProject((prev) => ({
      ...prev,
      components: prev.components.map((c) =>
        c.id === id ? { ...c, position_x: pos.x, position_y: pos.y, position_z: pos.z } : c
      )
    }));
  };

  // Salvar Projeto no Banco de Dados
  const handleSaveProject = async () => {
    try {
      const saved = await projectService.save(project);
      setProject(saved);
      alert('✅ Projeto de palmilha salvo com sucesso!');
    } catch (err) {
      alert('Erro ao salvar projeto.');
    }
  };

  // Exportar STL & Abrir Guia TPU
  const handleExportSTL = () => {
    if (typeof (window as any).__exportInsoleSTL === 'function') {
      (window as any).__exportInsoleSTL();
      setIsTPUSummaryOpen(true);
    } else {
      alert('Erro ao carregar exportador 3D.');
    }
  };

  const handleLoginSuccess = (tok: string, u: any) => {
    localStorage.setItem('fisiofeet_token', tok);
    setToken(tok);
    setUser(u);
  };

  const handleLogout = () => {
    authService.logout();
    localStorage.removeItem('fisiofeet_token');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const selectedScan = scans.find((s) => s.id === selectedScanId);
  const selectedComponent = project.components.find((c) => c.id === selectedComponentId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar Header */}
      <HeaderNav
        currentPatient={currentPatient}
        patients={patients}
        project={project}
        onSelectPatient={handleSelectPatient}
        onNewPatient={() => setIsPatientModalOpen(true)}
        onUpdateProjectName={(name) => setProject((prev) => ({ ...prev, project_name: name }))}
        onSaveProject={handleSaveProject}
        onExportSTL={handleExportSTL}
        onLogout={handleLogout}
        username={user?.username || 'fisioterapeuta'}
      />

      {/* Main CAD Studio Viewport + Sidebars Layout */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Layer Tree & Component Library */}
        <LeftSidebar
          project={project}
          scans={scans}
          selectedScanId={selectedScanId}
          selectedComponentId={selectedComponentId}
          onSelectScan={setSelectedScanId}
          onUploadScanClick={() => setIsUploadModalOpen(true)}
          onDirectFileUpload={handleUploadScan}
          onSelectComponent={setSelectedComponentId}
          onAddComponent={handleAddComponent}
          onDuplicateComponent={handleDuplicateComponent}
          onDeleteComponent={handleDeleteComponent}
        />

        {/* Central 3D Canvas Viewport */}
        <main className="flex-1 relative h-full bg-slate-950">
          <ViewportToolbar
            footSide={project.foot_side || 'right'}
            onSelectFootSide={(side) => setProject((prev) => ({ ...prev, foot_side: side }))}
            renderMode={renderMode}
            onSelectRenderMode={setRenderMode}
            viewpoint={viewpoint}
            onSelectViewpoint={setViewpoint}
            showFoot={showFoot}
            onToggleShowFoot={() => setShowFoot((prev) => !prev)}
            showGrid={showGrid}
            onToggleShowGrid={() => setShowGrid((prev) => !prev)}
          />

          <InsoleEditor3D
            project={project}
            scanUrl={selectedScan?.file_path || null}
            selectedComponentId={selectedComponentId}
            onSelectComponent={setSelectedComponentId}
            onUpdateComponentPosition={handleUpdateComponentPosition}
            renderMode={renderMode}
            viewpoint={viewpoint}
            showFoot={showFoot}
            showGrid={showGrid}
          />
        </main>

        {/* Right Property Inspector Panel */}
        <RightPropertyPanel
          project={project}
          selectedComponent={selectedComponent}
          onUpdateBaseThickness={handleUpdateBaseThickness}
          onUpdateArchHeight={handleUpdateArchHeight}
          onUpdateArchWidth={handleUpdateArchWidth}
          onUpdateComponent={handleUpdateComponent}
        />
      </div>

      {/* Modais da Aplicação */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSubmit={handleCreatePatient}
      />

      <UploadScanModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadScan}
      />

      <ExportTPUSummaryModal
        isOpen={isTPUSummaryOpen}
        onClose={() => setIsTPUSummaryOpen(false)}
        projectName={project.project_name}
      />
    </div>
  );
}

export default App;
