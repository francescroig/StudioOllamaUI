import { useEffect, useState } from 'react';
import { useStore } from '../store';
import SettingsPanel from './SettingsPanel';
import { 
  Plus, Globe, X, ShieldAlert, RefreshCw, 
  Thermometer, BrainCircuit, Terminal, Coins, FileText, Folder
} from 'lucide-react';

export default function Sidebar() {
  const state = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const engines = ['tavily', 'google', 'bing', 'duckduckgo'];

  useEffect(() => { state.fetchModels(); }, []);

  const selectWorkingDirectory = () => {
    const input = document.createElement('input');
    input.type = 'file';
    // @ts-ignore - webkitdirectory es no estándar pero ampliamente soportado
    input.webkitdirectory = true;
    input.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        // Obtener la ruta de la carpeta desde el primer archivo
        const filePath = files[0].path || files[0].webkitRelativePath;
        const folderPath = filePath.substring(0, filePath.lastIndexOf('\\') || filePath.lastIndexOf('/'));
        state.setWorkingDirectory(folderPath || files[0].webkitRelativePath.split('/')[0]);
      }
    };
    input.click();
  };

  return (
    <div className="w-64 bg-[#1a1c23] h-screen flex flex-col text-gray-300 border-r border-gray-800 font-sans">
      <div className="p-4">
        <button onClick={() => state.createNewConversation()} className="w-full bg-blue-600 text-white p-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold hover:bg-blue-700 transition-all">
          <Plus size={16}/> Nueva Charla
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-5 custom-scrollbar pb-4">
        {/* BUSCADORES */}
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2"><Globe size={12}/> Motores</label>
          <div className="grid grid-cols-2 gap-1 bg-black/20 p-1 rounded-lg">
            {engines.map((m) => (
              <button key={m} onClick={() => state.setSearchEngine(m)} className={`text-[9px] py-1.5 rounded font-bold uppercase ${state.searchEngine === m ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{m}</button>
            ))}
          </div>
          <label className="flex items-center justify-between p-2 bg-[#2d313e]/40 border border-gray-700 rounded text-[10px] font-bold cursor-pointer">
            <span className={state.webSearchEnabled ? "text-blue-400" : "text-gray-500"}>BÚSQUEDA WEB</span>
            <input type="checkbox" checked={!!state.webSearchEnabled} onChange={e => state.setWebSearchEnabled(e.target.checked)} />
          </label>
        </div>

        {/* MODELO Y PARÁMETROS */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-gray-500 font-bold uppercase">Modelo</label>
              <RefreshCw size={11} className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => state.fetchModels()}/>
            </div>
            <select 
              value={state.selectedModel || ''} 
              onChange={(e) => state.setSelectedModel(e.target.value)} 
              className="w-full bg-[#2d313e] border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-blue-500"
            >
              {!state.selectedModel && <option value="">-- Selecciona un modelo --</option>}
              {state.models?.map((m: string) => <option key={m} value={m}>{m}</option>)}
            </select>
            {!state.selectedModel && state.models?.length > 0 && (
              <div className="text-[8px] text-yellow-400 flex items-center gap-1">
                ⚠️ Modelo no seleccionado
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2"><BrainCircuit size={12}/> Razonamiento</label>
            <select value={state.reasoningLevel || 'standard'} onChange={(e) => state.setReasoningLevel(e.target.value)} className="w-full bg-[#2d313e] border border-gray-700 rounded p-2 text-xs text-white outline-none">
              <option value="fast">Rápido</option><option value="standard">Estándar</option><option value="deep">Deep Think</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2"><Thermometer size={12}/> Temp: {state.temperature}</label>
            <input type="range" min="0" max="2" step="0.1" value={state.temperature ?? 0.7} onChange={(e) => state.setTemperature(parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
        </div>

        {/* HISTORIAL */}
        <div className="space-y-1 border-t border-gray-800 pt-4">
          <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2">Historial</label>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {state.conversations?.map((c: any) => (
              <div key={c.id} className={`group flex items-center justify-between p-2 rounded text-[11px] cursor-pointer ${state.currentConversationId === c.id ? 'bg-[#2d313e] text-white' : 'text-gray-400 hover:bg-[#2d313e]/40'}`}>
                <span className="truncate flex-1" onClick={() => state.loadConversation(c.id)}>{c.title}</span>
                <X size={12} className="opacity-0 group-hover:opacity-100 hover:text-red-400" onClick={(e) => { e.stopPropagation(); state.deleteConversation(c.id); }}/>
              </div>
            ))}
          </div>
        </div>

        {/* PROMPT GLOBAL */}
        <div className="space-y-2 border-t border-gray-800 pt-4">
          <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
            <FileText size={12}/> Prompt Global
          </label>
          <textarea
            value={state.globalPrompt || ''}
            onChange={(e) => state.setGlobalPrompt(e.target.value)}
            placeholder="Instrucciones que se añadirán a cada mensaje..."
            className="w-full bg-[#2d313e] border border-gray-700 rounded p-2 text-xs text-white outline-none resize-none h-20 focus:border-blue-500"
          />
          <div className="text-[8px] text-gray-600">
            Este prompt se añadirá automáticamente a cada conversación
          </div>
        </div>

        {/* CARPETA DE TRABAJO */}
        <div className="space-y-2 border-t border-gray-800 pt-4">
          <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
            <Folder size={12}/> Carpeta de Trabajo
          </label>
          <button
            onClick={selectWorkingDirectory}
            className="w-full bg-[#2d313e] hover:bg-gray-700 border border-gray-700 rounded p-2 text-xs text-white transition-all flex items-center justify-center gap-2"
          >
            <Folder size={14}/>
            {state.workingDirectory || 'Seleccionar carpeta'}
          </button>
          <div className="text-[8px] text-gray-600">
            Carpeta donde guardar/leer archivos del modelo
          </div>
        </div>

        {/* MODOS */}
        <div className="space-y-2 border-t border-gray-800 pt-4">
          <label className="flex items-center justify-between p-2 bg-[#1e212b] border border-amber-900/30 rounded text-[10px] font-bold cursor-pointer">
            <span className="flex items-center gap-2 text-amber-400"><ShieldAlert size={14}/> REVISIÓN EXHAUSTIVA</span>
            <input type="checkbox" checked={!!state.criticalMode} onChange={e => state.setCriticalMode(e.target.checked)} />
          </label>
          <div className="text-[8px] text-gray-600 px-2">
            Obliga al modelo a verificar al máximo la exactitud y veracidad de la respuesta
          </div>
        </div>
      </div>

      {/* CONTADOR DE TOKENS AL FONDO */}
      <div className="p-4 border-t border-gray-800 bg-[#0f1115]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500 font-bold uppercase flex items-center gap-2">
            <Coins size={12}/> Tokens
          </span>
          <span className="text-blue-400 font-mono font-bold">
            {state.tokenStats?.totalTokens?.toLocaleString() || '0'}
          </span>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}