import React, { useState } from 'react';
import type { Patient } from '../../types/insole';
import {
  X,
  Upload,
  UserPlus,
  Printer,
  CheckCircle2,
  Lock,
  User
} from 'lucide-react';

// Modal Novo Paciente
export const PatientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Patient>) => Promise<void> | void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [footSize, setFootSize] = useState('39/40');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    try {
      await onSubmit({
        name,
        age: age ? parseInt(age) : undefined,
        foot_size: footSize,
        notes
      });
      setLoading(false);
      setName('');
      setAge('');
      setNotes('');
      onClose();
    } catch (err: any) {
      setLoading(false);
      const errMsg = err?.response?.data?.error || err?.message || 'Erro ao cadastrar paciente. Tente novamente.';
      setError(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-400" /> Cadastrar Novo Paciente
          </h3>
          <button onClick={onClose} disabled={loading} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full bg-slate-800 text-sm text-slate-100 p-2.5 rounded-lg border border-slate-700 outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Idade</label>
              <input
                type="number"
                disabled={loading}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ex: 42"
                className="w-full bg-slate-800 text-sm text-slate-100 p-2.5 rounded-lg border border-slate-700 outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tamanho do Calçado</label>
              <input
                type="text"
                disabled={loading}
                value={footSize}
                onChange={(e) => setFootSize(e.target.value)}
                placeholder="Ex: BR 39"
                className="w-full bg-slate-800 text-sm text-slate-100 p-2.5 rounded-lg border border-slate-700 outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Observações Clínicas / Patologia</label>
            <textarea
              rows={3}
              disabled={loading}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Fascite plantar, pisada pronada, esporão de calcâneo..."
              className="w-full bg-slate-800 text-sm text-slate-100 p-2.5 rounded-lg border border-slate-700 outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-sm rounded-lg shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <span>Salvar Paciente</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal Upload de Arquivo 3D
export const UploadScanModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}> = ({ isOpen, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['stl', 'obj', 'ply'].includes(ext || '')) {
        setError('Formato de arquivo inválido. Por favor selecione um arquivo .stl, .obj ou .ply.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError('');
    try {
      await onUpload(selectedFile);
      setLoading(false);
      setSelectedFile(null);
      onClose();
    } catch (err: any) {
      setLoading(false);
      const errMsg = err?.response?.data?.error || err?.message || 'Falha ao enviar arquivo 3D para o servidor.';
      setError(errMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" /> Upload de Escaneamento 3D (.STL / .OBJ / .PLY)
          </h3>
          <button onClick={onClose} disabled={loading} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 text-center bg-slate-800/40 transition-all cursor-pointer">
          <input
            type="file"
            accept=".stl,.obj,.ply"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
            id="scan-file-input"
          />
          <label htmlFor="scan-file-input" className="cursor-pointer block">
            <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-3 opacity-80" />
            <span className="text-sm font-semibold text-slate-200 block">
              Clique para selecionar o arquivo 3D do pé
            </span>
            <span className="text-xs text-slate-400 block mt-1">
              Formatos aceitos: Creality CR Scan Ferret (.stl, .obj, .ply) até 100MB
            </span>
          </label>
        </div>

        {selectedFile && (
          <div className="bg-cyan-950/40 border border-cyan-500/30 p-3 rounded-lg flex items-center justify-between">
            <div className="truncate">
              <span className="text-xs font-semibold text-cyan-300 block truncate">{selectedFile.name}</span>
              <span className="text-[10px] text-slate-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            disabled={!selectedFile || loading}
            onClick={handleUploadSubmit}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Processando Upload...</span>
              </>
            ) : (
              <span>Confirmar Upload</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal Guia de Impressão 3D TPU
export const ExportTPUSummaryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}> = ({ isOpen, onClose, projectName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <Printer className="w-5 h-5" /> Arquivo STL Gerado & Guia de Impressão TPU
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl flex items-start space-x-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-200">Download Iniciado!</h4>
            <p className="text-xs text-slate-300 mt-1">
              O arquivo 3D <span className="font-mono text-cyan-300 font-bold">{projectName}_TPU.stl</span> foi fundido com sucesso e baixado no seu computador.
            </p>
          </div>
        </div>

        {/* Tabela de Parâmetros Recomendados para TPU */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Configurações Recomendadas no Fatiador (Cura / PrusaSlicer / Bambu)
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Material Recomendado</span>
              <span className="font-semibold text-slate-200">Filamento TPU (Shore 85A - 95A)</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Altura de Camada (Layer)</span>
              <span className="font-semibold text-slate-200">0.20 mm (Bico 0.4mm)</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Preenchimento (Infill)</span>
              <span className="font-semibold text-slate-200">15% a 25% Gyroid (Flexível)</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Temperatura do Bico / Mesa</span>
              <span className="font-semibold text-slate-200">220°C Bico / 50°C Mesa</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Velocidade de Impressão</span>
              <span className="font-semibold text-slate-200">25 - 35 mm/s</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Suportes</span>
              <span className="font-semibold text-emerald-400">Não Necessário (Geometria Plana)</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            Entendido, Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente de Login do Fisioterapeuta
export const LoginForm: React.FC<{
  onLoginSuccess: (token: string, user: any) => void;
}> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('fisioterapeuta');
  const [password, setPassword] = useState('senha123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('fisiofeet_token', data.token);
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Falha ao autenticar.');
      }
    } catch (err) {
      setError('Servidor indisponível. Verifique se o backend está em execução.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/30">
            <User className="w-8 h-8 text-slate-950 font-bold" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            FisioFeet 3D
          </h2>
          <p className="text-xs text-slate-400">Acesso Restrito ao Fisioterapeuta</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Usuário</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-800 text-sm text-slate-100 p-3 rounded-xl border border-slate-700 outline-none focus:border-cyan-500 pl-10"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Senha</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-800 text-sm text-slate-100 p-3 rounded-xl border border-slate-700 outline-none focus:border-cyan-500 pl-10"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>

        <div className="bg-slate-800/40 p-3 rounded-xl text-center text-[11px] text-slate-400 border border-slate-800">
          🔑 Usuário padrão de acesso rápido: <span className="text-cyan-300 font-mono font-bold">fisioterapeuta</span> / <span className="text-cyan-300 font-mono font-bold">senha123</span>
        </div>
      </div>
    </div>
  );
};
