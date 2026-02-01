/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { useState, useEffect } from 'react';
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import ModelsPanel from "./ModelsPanel";
import HelpPanel from "./HelpPanel";
import SettingsPanel from "./SettingsPanel";
import LanguageSelector from "./LanguageSelector";
import { Settings } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useStore } from '../store';
import { ollamaService } from '../api/ollamaService';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation();
  const state = useStore();

  // Sincronizar configuración de Ollama al cargar y cuando cambie
  useEffect(() => {
    if (state.ollamaConfig) {
      ollamaService.setConfig(state.ollamaConfig.apiUrl, state.ollamaConfig.apiKey);
      console.log('🔄 Configuración de Ollama sincronizada:', state.ollamaConfig);
    }
  }, [state.ollamaConfig]);

  return (
    <div className="flex h-screen w-screen bg-[#0f1115] overflow-hidden">
      {/* Selector de idioma en la esquina superior derecha */}
      <LanguageSelector />
      
      <Sidebar />
      <ChatArea />
      <ModelsPanel />
      <HelpPanel />
      
      {/* Botón de Configuración flotante */}
      <button 
        onClick={() => setShowSettings(true)}
        title={t('settings')}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xl z-40 hover:bg-purple-700 transition-all hover:scale-110"
      >
        <Settings size={20} />
      </button>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
