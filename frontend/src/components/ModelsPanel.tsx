/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { useState, useEffect } from "react";
import { Download, Trash2, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useStore } from "../store";
import { useTranslation } from "../i18n";

export default function ModelsPanel() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { models, fetchModels } = useStore();
  const [searchInput, setSearchInput] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => { 
    if (isOpen) fetchModels(); 
  }, [isOpen]);

  const download = async () => {
    if (!searchInput.trim()) {
      setDownloadError(t('enterModelNameError'));
      return;
    }

    setDownloading(true);
    setDownloadStatus(t('startingDownload'));
    setDownloadProgress(0);
    setDownloadError("");

    try {
      const response = await fetch("http://localhost:11434/api/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchInput.trim(), stream: true })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error(t('downloadInitError'));

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const json = JSON.parse(line);
            
            if (json.status) {
              setDownloadStatus(json.status);
            }

            // Calcular progreso si hay información de tamaño
            if (json.completed && json.total) {
              const progress = Math.round((json.completed / json.total) * 100);
              setDownloadProgress(progress);
            }

            // Si hay error
            if (json.error) {
              throw new Error(json.error);
            }

            // Si terminó exitosamente
            if (json.status === "success") {
              setDownloadStatus(`✅ ${t('downloadComplete')}`);
              setDownloadProgress(100);
              setTimeout(() => {
                setSearchInput("");
                setDownloadStatus("");
                setDownloadProgress(0);
                fetchModels();
              }, 2000);
            }
          } catch (parseError) {
            console.error("Error parsing line:", parseError);
          }
        }
      }

    } catch (error: any) {
      console.error("Error downloading model:", error);
      setDownloadError(error.message || t('modelDownloadError'));
      setDownloadStatus("");
    } finally {
      setDownloading(false);
    }
  };

  const deleteModel = async (name: string) => {
    if (!confirm(`${t('deleteModelConfirm')} ${name}?`)) return;
    
    try {
      const response = await fetch("http://localhost:11434/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error(t('modelDeleteError'));
      }

      fetchModels();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)} 
      className="fixed bottom-[136px] right-6 w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-2xl z-40 hover:bg-orange-600 transition-all hover:scale-110"
    >
      <Download size={20} />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
      <div className="bg-[#1a1c23] border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-bold">{t('modelManager')}</h2>
          <X className="cursor-pointer text-gray-500 hover:text-white" onClick={() => setIsOpen(false)} />
        </div>

        {/* Input de búsqueda y botón de descarga */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={t('enterModelName')}
              value={searchInput} 
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !downloading && download()}
              disabled={downloading}
              className="flex-1 bg-black/40 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-orange-500 disabled:opacity-50" 
            />
            <button 
              onClick={download} 
              disabled={downloading || !searchInput.trim()}
              className="bg-orange-600 px-4 rounded-lg text-white hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
          </div>

          {/* Barra de progreso */}
          {downloading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{downloadStatus}</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-orange-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Mensaje de error */}
          {downloadError && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Mensaje de éxito */}
          {downloadStatus.includes("✅") && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 text-xs text-green-300 flex items-center gap-2">
              <CheckCircle size={14} />
              <span>{t('modelDownloadedSuccess')}</span>
            </div>
          )}

          {/* Ayuda */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded p-2 text-[10px] text-blue-300">
            <strong>💡 Tip:</strong> {t('visitLibrary')} <a href="https://ollama.com/library" target="_blank" className="underline hover:text-blue-200">ollama.com/library</a> {t('toSeeModels')}
          </div>
        </div>

        {/* Lista de modelos instalados */}
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          <div className="text-xs text-gray-500 font-bold uppercase mb-2">
            {t('modelsInstalled')} ({models.length})
          </div>
          {models.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <Download size={24} className="mx-auto mb-2 opacity-50" />
              <p>{t('noModelsInstalled')}</p>
              <p className="text-xs mt-1">{t('downloadToStart')}</p>
            </div>
          ) : (
            models.map((m: any) => (
              <div key={m} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-gray-800 hover:bg-white/10 transition-all group">
                <span className="text-sm text-gray-300 font-mono">{m}</span>
                <Trash2 
                  size={14} 
                  className="text-gray-600 group-hover:text-red-500 cursor-pointer transition-colors" 
                  onClick={() => deleteModel(m)} 
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
