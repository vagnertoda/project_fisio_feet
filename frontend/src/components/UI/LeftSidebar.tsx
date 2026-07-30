import React, { useRef } from 'react';
import type {
  InsoleProject,
  OrthopedicComponentType,
  FootScan
} from '../../types/insole';
import {
  Layers,
  PlusCircle,
  Trash2,
  Copy,
  Upload,
  Activity,
  ShieldAlert,
  Zap,
  Disc,
  Feather
} from 'lucide-react';

interface LeftSidebarProps {
  project: InsoleProject;
  scans: FootScan[];
  selectedScanId: number | null;
  selectedComponentId: string | null;
  onSelectScan: (scanId: number | null) => void;
  onDeleteScan?: (scanId: number) => void;
  onUploadScanClick: () => void;
  onDirectFileUpload?: (file: File) => void;
  onSelectComponent: (id: string | null) => void;
  onAddComponent: (type: OrthopedicComponentType) => void;
  onDuplicateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  project,
  scans,
  selectedScanId,
  selectedComponentId,
  onSelectScan,
  onDeleteScan,
  onUploadScanClick,
  onDirectFileUpload,
  onSelectComponent,
  onAddComponent,
  onDuplicateComponent,
  onDeleteComponent
}) => {
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadButtonClick = () => {
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    } else {
      onUploadScanClick();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (onDirectFileUpload) {
        onDirectFileUpload(file);
      } else {
        onUploadScanClick();
      }
    }
  };

  return (
    <aside className="w-80 h-[calc(100vh-4rem)] border-r border-slate-800 bg-slate-900/90 backdrop-blur-xl flex flex-col z-10 select-none">
      {/* Input de arquivo oculto para acionamento direto do botão Upload Scan */}
      <input
        type="file"
        ref={hiddenFileInputRef}
        onChange={handleFileChange}
        accept=".stl,.obj,.ply"
        className="hidden"
      />

      {/* 1. Seção de Escaneamento 3D do Pé */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" /> Escaneamento 3D (.STL / .OBJ)
          </span>
          <button
            type="button"
            onClick={handleUploadButtonClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/40 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-300" />
            <span>Upload Scan</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full min-w-0">
          <select
            value={selectedScanId || ''}
            onChange={(e) => onSelectScan(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 min-w-0 bg-slate-950/80 text-xs text-slate-200 p-2.5 rounded-lg border border-slate-700/80 outline-none cursor-pointer focus:border-cyan-500 truncate"
          >
            <option value="">Pé Anatômico Sintético (Modelo Padrão)</option>
            {scans.map((s) => (
              <option key={s.id} value={s.id}>
                Scan #{s.id} ({s.file_format.toUpperCase()}) - {new Date(s.upload_date).toLocaleDateString()}
              </option>
            ))}
          </select>

          {selectedScanId && onDeleteScan && (
            <button
              type="button"
              onClick={() => onDeleteScan(selectedScanId)}
              title="Excluir este escaneamento 3D"
              className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg border border-rose-500/30 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Biblioteca de Componentes Ortopédicos */}
      <div className="p-4 border-b border-slate-800/80 flex-1 overflow-y-auto space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4 text-emerald-400" /> Adicionar Componentes Ortopédicos
        </h3>

        <div className="grid grid-cols-1 gap-2.5">
          <button
            onClick={() => onAddComponent('amortecedor_calcaneo')}
            className="flex items-center space-x-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/60 hover:border-emerald-500/60 text-left transition-all group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Amortecedor de Calcâneo</div>
              <div className="text-[10px] text-slate-400">Absorção de impacto no calcanhar</div>
            </div>
          </button>

          <button
            onClick={() => onAddComponent('piloto_metatarso')}
            className="flex items-center space-x-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/60 hover:border-cyan-500/60 text-left transition-all group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30 transition-colors">
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Piloto / Barra Metatarsal</div>
              <div className="text-[10px] text-slate-400">Alívio de dor na antepé</div>
            </div>
          </button>

          <button
            onClick={() => onAddComponent('cunha_pronacao')}
            className="flex items-center space-x-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/60 hover:border-blue-500/60 text-left transition-all group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Cunha de Pronação</div>
              <div className="text-[10px] text-slate-400">Correção de pisada valga</div>
            </div>
          </button>

          <button
            onClick={() => onAddComponent('cunha_supinacao')}
            className="flex items-center space-x-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/60 hover:border-purple-500/60 text-left transition-all group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30 transition-colors">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Cunha de Supinação</div>
              <div className="text-[10px] text-slate-400">Correção de pisada vara</div>
            </div>
          </button>

          <button
            onClick={() => onAddComponent('estimulo_proprioceptivo')}
            className="flex items-center space-x-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/60 hover:border-amber-500/60 text-left transition-all group shadow-sm"
          >
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30 transition-colors">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Estímulo Proprioceptivo</div>
              <div className="text-[10px] text-slate-400">Estímulo neurossensorial plantar</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Árvore de Camadas / Elementos do Projeto */}
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-blue-400" /> Estrutura do Projeto</span>
          <span className="text-[10px] bg-slate-800 font-mono text-cyan-300 px-2 py-0.5 rounded-md border border-slate-700">{project.components.length + 1} Elementos</span>
        </h3>

        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {/* Elemento Fixo Palmilha Base */}
          <div className="p-3 bg-slate-800/90 rounded-xl border border-blue-500/40 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              <span className="text-xs font-bold text-slate-100">Palmilha Base Ortopédica</span>
            </div>
            <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded-md border border-blue-800">{project.base_thickness}mm</span>
          </div>

          {/* Lista de Componentes adicionados */}
          {project.components.map((comp) => {
            const isSelected = comp.id === selectedComponentId;
            return (
              <div
                key={comp.id}
                onClick={() => onSelectComponent(comp.id)}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: comp.color || '#22c55e' }}
                  />
                  <span className="text-xs font-semibold truncate">{comp.name}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateComponent(comp.id);
                    }}
                    title="Duplicar"
                    className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteComponent(comp.id);
                    }}
                    title="Remover"
                    className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
