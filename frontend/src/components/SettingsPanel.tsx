import { useStore } from '../store';
import { X, Key, Server, Globe, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const state = useStore();
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1c23] w-full max-w-md rounded-xl border border-gray-800 p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <SettingsIcon size={18}/> Configuración Global
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20}/>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Ollama Config */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
              <Server size={12}/> Configuración Ollama
            </label>
            <input 
              type="text" 
              placeholder="URL Ollama (ej: http://localhost:11434)" 
              value={state.ollamaConfig.apiUrl || ''} 
              onChange={(e) => state.setOllamaConfig({apiUrl: e.target.value})} 
              className="w-full bg-black/20 border border-gray-700 rounded p-2.5 text-white text-xs outline-none focus:border-blue-500"
            />
            <input 
              type="password" 
              placeholder="API Key Ollama (opcional)" 
              value={state.ollamaConfig.apiKey || ''} 
              onChange={(e) => state.setOllamaConfig({apiKey: e.target.value})} 
              className="w-full bg-black/20 border border-gray-700 rounded p-2.5 text-white text-xs outline-none focus:border-blue-500"
            />
          </div>

          {/* Search APIs */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
              <Globe size={12}/> APIs de Búsqueda Web
            </label>
            
            <div className="space-y-2">
              <input 
                type="password" 
                placeholder="🔍 API Key Tavily" 
                value={state.searchAPIs.tavily || ''} 
                onChange={(e) => state.setSearchAPIs({...state.searchAPIs, tavily: e.target.value})} 
                className="w-full bg-black/20 border border-gray-700 rounded p-2.5 text-white text-xs outline-none focus:border-blue-500"
              />
              
              <input 
                type="password" 
                placeholder="🔍 API Key Google" 
                value={state.searchAPIs.google || ''} 
                onChange={(e) => state.setSearchAPIs({...state.searchAPIs, google: e.target.value})} 
                className="w-full bg-black/20 border border-gray-700 rounded p-2.5 text-white text-xs outline-none focus:border-blue-500"
              />
              
              <input 
                type="password" 
                placeholder="🔍 API Key Bing" 
                value={state.searchAPIs.bing || ''} 
                onChange={(e) => state.setSearchAPIs({...state.searchAPIs, bing: e.target.value})} 
                className="w-full bg-black/20 border border-gray-700 rounded p-2.5 text-white text-xs outline-none focus:border-blue-500"
              />
              
              <div className="bg-blue-900/20 border border-blue-700/30 rounded p-2 text-[10px] text-blue-300">
                <span className="font-bold">ℹ️ DuckDuckGo:</span> No requiere API key
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-800/30 border border-gray-700 rounded p-3 text-[10px] text-gray-400">
            <p className="mb-1"><strong className="text-gray-300">Ollama API Key:</strong> Solo si usas un servidor remoto protegido</p>
            <p><strong className="text-gray-300">Search APIs:</strong> Necesarias solo si activas búsqueda web</p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full bg-blue-600 text-white py-2.5 rounded font-bold transition-colors hover:bg-blue-500"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}