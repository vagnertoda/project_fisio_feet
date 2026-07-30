import type { InsoleProject, OrthopedicComponent } from '../../types/insole';
import { Sliders, Move, Maximize2, Cpu, Settings } from 'lucide-react';

interface RightPropertyPanelProps {
  project: InsoleProject;
  selectedComponent: OrthopedicComponent | null;
  onUpdateBaseThickness: (val: number) => void;
  onUpdateArchHeight: (val: number) => void;
  onUpdateArchWidth: (val: number) => void;
  onUpdateComponent: (id: string, updates: Partial<OrthopedicComponent>) => void;
}

export const RightPropertyPanel: React.FC<RightPropertyPanelProps> = ({
  project,
  selectedComponent,
  onUpdateBaseThickness,
  onUpdateArchHeight,
  onUpdateArchWidth,
  onUpdateComponent,
}) => {
  return (
    <aside className="w-80 h-[calc(100vh-4rem)] border-l border-slate-700/60 bg-slate-900/80 backdrop-blur-md flex flex-col z-10 select-none overflow-y-auto p-4 space-y-6">
      {/* 1. Parâmetros da Palmilha Base */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/80 shadow-lg">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4" /> Palmilha Base Anatômica
        </h3>

        {/* Slider Espessura Geral (2mm a 15mm) */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span>Espessura Geral (Base)</span>
            <span className="text-cyan-400 font-mono">{project.base_thickness} mm</span>
          </div>
          <input
            type="range"
            min="2"
            max="15"
            step="0.5"
            value={project.base_thickness}
            onChange={(e) => onUpdateBaseThickness(parseFloat(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>2 mm (Fina)</span>
            <span>15 mm (Espessa)</span>
          </div>
        </div>

        {/* Slider Altura do Arco Plantar (0mm a 20mm) */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span>Altura do Arco Plantar</span>
            <span className="text-emerald-400 font-mono">{project.arch_height} mm</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={project.arch_height}
            onChange={(e) => onUpdateArchHeight(parseFloat(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0 mm (Plano)</span>
            <span>20 mm (Elevado)</span>
          </div>
        </div>

        {/* Slider Largura do Arco */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span>Largura do Arco Medial</span>
            <span className="text-blue-400 font-mono">{project.arch_width} mm</span>
          </div>
          <input
            type="range"
            min="15"
            max="40"
            step="1"
            value={project.arch_width}
            onChange={(e) => onUpdateArchWidth(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* 2. Inspetor de Propriedades do Componente Selecionado */}
      {selectedComponent ? (
        <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-500/40 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" /> Edição do Componente
            </h3>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
              Selecionado
            </span>
          </div>

          {/* Nome do Componente */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold mb-1 block">Nome do Elemento</label>
            <input
              type="text"
              value={selectedComponent.name}
              onChange={(e) => onUpdateComponent(selectedComponent.id, { name: e.target.value })}
              className="w-full bg-slate-900 text-xs text-slate-200 p-2 rounded border border-slate-700 outline-none font-medium"
            />
          </div>

          {/* Posicionamento 3D (X, Z em mm) */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1">
              <Move className="w-3.5 h-3.5 text-cyan-400" /> Posicionamento (mm)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Eixo X (Medial/Lateral)</span>
                <input
                  type="number"
                  min="-50"
                  max="50"
                  value={selectedComponent.position_x}
                  onChange={(e) =>
                    onUpdateComponent(selectedComponent.id, { position_x: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-900 text-xs font-mono text-cyan-300 p-1.5 rounded border border-slate-700 text-center"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Eixo Z (Anterior/Posterior)</span>
                <input
                  type="number"
                  min="-120"
                  max="120"
                  value={selectedComponent.position_z}
                  onChange={(e) =>
                    onUpdateComponent(selectedComponent.id, { position_z: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-900 text-xs font-mono text-cyan-300 p-1.5 rounded border border-slate-700 text-center"
                />
              </div>
            </div>
          </div>

          {/* Dimensões (Largura, Altura, Profundidade) */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold mb-2 flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" /> Dimensões (mm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Largura</span>
                <input
                  type="number"
                  min="2"
                  max="80"
                  value={selectedComponent.width}
                  onChange={(e) =>
                    onUpdateComponent(selectedComponent.id, { width: parseFloat(e.target.value) || 2 })
                  }
                  className="w-full bg-slate-900 text-xs font-mono text-emerald-300 p-1.5 rounded border border-slate-700 text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Altura</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={selectedComponent.height}
                  onChange={(e) =>
                    onUpdateComponent(selectedComponent.id, { height: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full bg-slate-900 text-xs font-mono text-emerald-300 p-1.5 rounded border border-slate-700 text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Profund.</span>
                <input
                  type="number"
                  min="2"
                  max="120"
                  value={selectedComponent.depth}
                  onChange={(e) =>
                    onUpdateComponent(selectedComponent.id, { depth: parseFloat(e.target.value) || 2 })
                  }
                  className="w-full bg-slate-900 text-xs font-mono text-emerald-300 p-1.5 rounded border border-slate-700 text-center"
                />
              </div>
            </div>
          </div>

          {/* Dureza / Tipo de Material TPU para Impressão */}
          <div>
            <label className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" /> Material de Impressão TPU
            </label>
            <select
              value={selectedComponent.material_type}
              onChange={(e) => onUpdateComponent(selectedComponent.id, { material_type: e.target.value })}
              className="w-full bg-slate-900 text-xs text-slate-200 p-2 rounded border border-slate-700 outline-none"
            >
              <option value="TPU Soft (Shore 85A)">TPU Soft (Shore 85A - Amortecimento)</option>
              <option value="TPU Medium (Shore 95A)">TPU Medium (Shore 95A - Padrão Ortopédico)</option>
              <option value="TPU Firm (Shore 98A)">TPU Firm (Shore 98A - Correção Rígida)</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/20 rounded-xl p-6 border border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Clique em um componente ortopédico na cena 3D ou na lista à esquerda para editar suas dimensões e posição milimétrica.
          </p>
        </div>
      )}
    </aside>
  );
};
