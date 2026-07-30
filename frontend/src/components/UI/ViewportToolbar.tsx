import React from 'react';
import type { RenderMode, ViewpointPreset, FootSide } from '../../types/insole';
import {
  Eye,
  EyeOff,
  Grid
} from 'lucide-react';

interface ViewportToolbarProps {
  footSide: FootSide;
  onSelectFootSide: (side: FootSide) => void;
  renderMode: RenderMode;
  onSelectRenderMode: (mode: RenderMode) => void;
  viewpoint: ViewpointPreset;
  onSelectViewpoint: (vp: ViewpointPreset) => void;
  showFoot: boolean;
  onToggleShowFoot: () => void;
  showGrid: boolean;
  onToggleShowGrid: () => void;
}

export const ViewportToolbar: React.FC<ViewportToolbarProps> = ({
  footSide,
  onSelectFootSide,
  renderMode,
  onSelectRenderMode,
  viewpoint,
  onSelectViewpoint,
  showFoot,
  onToggleShowFoot,
  showGrid,
  onToggleShowGrid,
}) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-4 py-2 flex items-center space-x-4 shadow-2xl z-10 select-none">
      {/* 0. Seletor de Lado do Pé (Esquerdo / Direito) */}
      <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700">
        <button
          onClick={() => onSelectFootSide('left')}
          className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center space-x-1 ${footSide === 'left'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
            }`}
          title="Alinhar para Pé Esquerdo (Anatomia Côncava na Direita)"
        >
          <span>🦶 Pé Esquerdo</span>
        </button>
        <button
          onClick={() => onSelectFootSide('right')}
          className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center space-x-1 ${footSide === 'right'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-slate-200'
            }`}
          title="Alinhar para Pé Direito (Anatomia Côncava na Esquerda)"
        >
          <span>Pé Direito 🦶</span>
        </button>
      </div>

      <div className="h-4 w-px bg-slate-700" />

      {/* 1. Toggle Pé do Paciente */}
      <button
        onClick={onToggleShowFoot}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showFoot
            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
          }`}
        title="Ocultar ou Exibir Modelo do Pé"
      >
        {showFoot ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        <span>Modelo do Pé</span>
      </button>

      {/* 2. Toggle Grid 3D */}
      <button
        onClick={onToggleShowGrid}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showGrid
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
          }`}
        title="Ocultar ou Exibir Grade / Grid 3D"
      >
        <Grid className="w-3.5 h-3.5" />
        <span>{showGrid ? 'Grid Visível' : 'Grid Oculto'}</span>
      </button>

      <div className="h-4 w-px bg-slate-700" />

      {/* 3. Modo de Exibição (Sólido / Wireframe / X-Ray) */}
      <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
        <button
          onClick={() => onSelectRenderMode('solid')}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${renderMode === 'solid' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Sólido
        </button>
        <button
          onClick={() => onSelectRenderMode('wireframe')}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${renderMode === 'wireframe' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Wireframe
        </button>
        <button
          onClick={() => onSelectRenderMode('xray')}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${renderMode === 'xray' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Raio-X (Rx)
        </button>
      </div>

      <div className="h-4 w-px bg-slate-700" />

      {/* 4. Presets de Câmera 3D */}
      <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
        <button
          onClick={() => onSelectViewpoint('perspective')}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${viewpoint === 'perspective' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          title="Visão 3D Livre Perspectiva"
        >
          3D
        </button>
        <button
          onClick={() => onSelectViewpoint('top')}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${viewpoint === 'top' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          title="Vista de Cima (Plantar)"
        >
          Cima
        </button>
        <button
          onClick={() => onSelectViewpoint('lateral_medial')}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${viewpoint === 'lateral_medial' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          title="Vista Medial"
        >
          Medial
        </button>
        <button
          onClick={() => onSelectViewpoint('lateral_lateral')}
          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${viewpoint === 'lateral_lateral' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          title="Vista Lateral"
        >
          Lateral
        </button>
      </div>
    </div>
  );
};
