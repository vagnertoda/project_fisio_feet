import type { Patient, InsoleProject } from '../../types/insole';
import {
  Footprints,
  UserCheck,
  Save,
  Download,
  Plus,
  LogOut,
  FolderOpen
} from 'lucide-react';

interface HeaderNavProps {
  currentPatient: Patient | null;
  patients: Patient[];
  project: InsoleProject;
  onSelectPatient: (patientId: number) => void;
  onNewPatient: () => void;
  onUpdateProjectName: (name: string) => void;
  onSaveProject: () => void;
  onExportSTL: () => void;
  onLogout: () => void;
  username: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentPatient,
  patients,
  project,
  onSelectPatient,
  onNewPatient,
  onUpdateProjectName,
  onSaveProject,
  onExportSTL,
  onLogout,
  username
}) => {
  return (
    <header className="h-16 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between text-slate-100 z-20 select-none">
      {/* Brand Logo & App Name */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Footprints className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent tracking-wide">
            FisioFeet 3D
          </h1>
          <span className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">
            Modelagem Digital de Palmilhas TPU
          </span>
        </div>
      </div>

      {/* Patient Selector & Project Name */}
      <div className="flex items-center space-x-4">
        {/* Seletor de Paciente */}
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <select
            value={currentPatient?.id || ''}
            onChange={(e) => onSelectPatient(Number(e.target.value))}
            className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer pr-2 font-medium"
          >
            <option value="" disabled className="bg-slate-900 text-slate-400">
              -- Selecionar Paciente --
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                {p.name} {p.foot_size ? `(Tam: ${p.foot_size})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={onNewPatient}
            title="Cadastrar Novo Paciente"
            className="p-1 hover:bg-slate-700 text-cyan-400 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Input Nome do Projeto */}
        <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <FolderOpen className="w-4 h-4 text-blue-400" />
          <input
            type="text"
            value={project.project_name}
            onChange={(e) => onUpdateProjectName(e.target.value)}
            placeholder="Nome do Projeto"
            className="bg-transparent text-sm text-slate-200 outline-none w-48 font-medium placeholder-slate-500"
          />
        </div>
      </div>

      {/* Action Buttons: Save & Export STL */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onSaveProject}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg border border-slate-600 transition-all shadow-md active:scale-95"
        >
          <Save className="w-4 h-4 text-emerald-400" />
          <span>Salvar Projeto</span>
        </button>

        <button
          onClick={onExportSTL}
          className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-sm rounded-lg transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
        >
          <Download className="w-4.5 h-4.5 text-slate-950" />
          <span>Exportar .STL (TPU)</span>
        </button>

        <div className="h-6 w-px bg-slate-700 mx-1" />

        {/* Info Fisioterapeuta & Logout */}
        <div className="flex items-center space-x-2 pl-2">
          <span className="text-xs text-slate-400 font-medium">Dr(a). {username}</span>
          <button
            onClick={onLogout}
            title="Sair do Sistema"
            className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
