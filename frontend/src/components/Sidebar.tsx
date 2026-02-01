/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { useEffect, useState } from 'react';
import { useStore } from '../store';
import SettingsPanel from './SettingsPanel';
import { useTranslation } from '../i18n';
import { 
  Plus, Globe, X, ShieldAlert, RefreshCw, 
  Thermometer, BrainCircuit, Terminal, Coins, FileText, Folder, ChevronDown, ChevronUp
} from 'lucide-react';

export default function Sidebar() {
  const state = useStore();
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const engines = ['tavily', 'google', 'bing', 'duckduckgo'];

  const [importStatus, setImportStatus] = useState<string>('');

  useEffect(() => { state.fetchModels(); }, []);

  const importFilesToWorkFolder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true; 
    input.onchange = async (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setImportStatus(`Importando ${files.length} archivos...`);
        
        try {
          let successCount = 0;
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Usamos FormData para enviar el archivo real al servidor
            const formData = new FormData();
            formData.append('file', file);
            formData.append('destinationName', file.name);

            try {
              const response = await fetch('http://localhost:3001/api/files/import', {
                method: 'POST',
                // Importante: No ponemos Content-Type header, el navegador lo hará solo
                body: formData
              });
              
              if (response.ok) {
                successCount++;
              }
            } catch (error) {
              console.error('Error importando archivo:', error);
            }
          }
          
          setImportStatus(`✅ ${successCount} ${t('filesImported')}`);
          setTimeout(() => setImportStatus(''), 3000);
        } catch (error) {
          console.error('Error en importación:', error);
          setImportStatus(`❌ ${t('errorImporting')}`);
          setTimeout(() => setImportStatus(''), 3000);
        }
      }
    };
    input.click();
  };

  return (
    <div className="w-64 bg-[#1a1c23] h-screen flex flex-col text-gray-300 border-r border-gray-800 font-sans">
      <div className="p-4 flex-shrink-0">
        <button onClick={() => state.createNewConversation()} className="w-full bg-blue-600 text-white p-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold hover:bg-blue-700 transition-all">
          <Plus size={16}/> {t('newChat')}
        </button>
      </div>

      <div className="flex-1 px-4 space-y-5 pb-4 overflow-y-auto flex flex-col">
        {/* BUSCADORES */}
        <div className="space-y-2 flex-shrink-0">
          <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2"><Globe size={12}/> {t('engines')}</label>
          <div className="grid grid-cols-2 gap-1 bg-black/20 p-1 rounded-lg">
            {engines.map((m) => (
              <button key={m} onClick={() => state.setSearchEngine(m)} className={`text-[9px] py-1.5 rounded font-bold uppercase ${state.searchEngine === m ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>{m}</button>
            ))}
          </div>
          <label className="flex items-center justify-between p-2 bg-[#2d313e]/40 border border-gray-700 rounded text-[10px] font-bold cursor-pointer">
            <span className={state.webSearchEnabled ? "text-blue-400" : "text-gray-500"}>{t('webSearch')}</span>
            <input type="checkbox" checked={!!state.webSearchEnabled} onChange={e => state.setWebSearchEnabled(e.target.checked)} />
          </label>
        </div>

        {/* MODELO Y PARÁMETROS */}
        <div className="space-y-4 pt-2 flex-shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-gray-500 font-bold uppercase">{t('model')}</label>
              <RefreshCw size={11} className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => state.fetchModels()}/>
            </div>
            <select 
              value={state.selectedModel || ''} 
              onChange={(e) => state.setSelectedModel(e.target.value)} 
              className="w-full bg-[#2d313e] border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-blue-500"
            >
              {!state.selectedModel && <option value="">{t('selectModel')}</option>}
              {state.models?.map((m: string) => <option key={m} value={m}>{m}</option>)}
            </select>
            {!state.selectedModel && state.models?.length > 0 && (
              <div className="text-[8px] text-yellow-400 flex items-center gap-1">
                ⚠️ {t('modelNotSelected')}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2"><BrainCircuit size={12}/> {t('reasoning')}</label>
            <select value={state.reasoningLevel || 'standard'} onChange={(e) => state.setReasoningLevel(e.target.value)} className="w-full bg-[#2d313e] border border-gray-700 rounded p-2 text-xs text-white outline-none">
              <option value="fast">{t('reasoningFast')}</option>
              <option value="standard">{t('reasoningStandard')}</option>
              <option value="deep">{t('reasoningDeep')}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2"><Thermometer size={12}/> {t('temperature')}: {state.temperature}</label>
            <input type="range" min="0" max="2" step="0.1" value={state.temperature ?? 0.7} onChange={(e) => state.setTemperature(parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
          </div>
        </div>

        {/* HISTORIAL */}
        <div className="space-y-1 border-t-2 border-gray-700 pt-4 flex-shrink-0">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase mb-2 hover:text-gray-400 transition-colors"
          >
            <span>{t('history')}</span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showHistory && (
            <div className="h-40 overflow-y-auto space-y-1 pr-1">
              {state.conversations?.map((c: any) => (
                <div key={c.id} className={`group flex items-center justify-between p-2 rounded-lg text-[11px] cursor-pointer transition-all ${state.currentConversationId === c.id ? 'bg-blue-600 text-white border-2 border-blue-500' : 'bg-[#23252e] text-gray-300 border-2 border-gray-700 hover:bg-[#2d313e] hover:border-gray-600'}`}>
                  <span className="truncate flex-1" onClick={() => state.loadConversation(c.id)}>{c.title}</span>
                  <X size={12} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity" onClick={(e) => { e.stopPropagation(); state.deleteConversation(c.id); }}/>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROMPT GLOBAL */}
        <div className="space-y-2 border-t border-gray-800 pt-4 flex-shrink-0">
          <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
            <FileText size={12}/> {t('globalPromptLabel')}
          </label>
          <textarea
            value={state.globalPrompt || ''}
            onChange={(e) => state.setGlobalPrompt(e.target.value)}
            placeholder={t('globalPromptPlaceholder')}
            className="w-full bg-[#2d313e] border border-gray-700 rounded p-2 text-xs text-white outline-none resize-none h-20 focus:border-blue-500"
          />
          <div className="text-[8px] text-gray-600">
            {t('globalPromptHelp')}
          </div>
        </div>

        {/* IMPORTAR ARCHIVOS */}
        <div className="space-y-2 border-t border-gray-800 pt-4 flex-shrink-0">
          <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
            <Folder size={12}/> {t('importFiles')}
          </label>
          <button
            onClick={importFilesToWorkFolder}
            className="w-full bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 rounded p-2 text-xs text-white transition-all flex items-center justify-center gap-2 font-bold"
          >
            <Folder size={14}/>
            {t('importFiles')}
          </button>
          {importStatus && (
            <div className="text-[9px] text-center font-bold text-emerald-400">
              {importStatus}
            </div>
          )}
          <div className="text-[8px] text-gray-600">
            {t('importFilesDesc')}
          </div>
        </div>

        {/* MODOS */}
        <div className="space-y-2 border-t border-gray-800 pt-4">
          <label className="flex items-center justify-between p-2 bg-[#1e212b] border border-amber-900/30 rounded text-[10px] font-bold cursor-pointer">
            <span className="flex items-center gap-2 text-amber-400">
              <ShieldAlert size={14}/>
              {t('thoroughReview')}
            </span>
            <input type="checkbox" checked={!!state.criticalMode} onChange={e => state.setCriticalMode(e.target.checked)} />
          </label>
          <div className="text-[8px] text-gray-600 px-2">
            {t('thoroughReviewHelp')}
          </div>
        </div>
      </div>

      {/* CONTADOR DE TOKENS AL FONDO */}
      <div className="p-4 border-t border-gray-800 bg-[#0f1115]">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500 font-bold uppercase flex items-center gap-2">
              <Coins size={12}/> Tokens Total
            </span>
            <span className="text-blue-400 font-mono font-bold">
              {state.tokenStats?.totalTokens?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-gray-600">Entrada</span>
            <span className="text-green-400 font-mono">
              {state.tokenStats?.inputTokens?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-gray-600">Salida</span>
            <span className="text-purple-400 font-mono">
              {state.tokenStats?.outputTokens?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}