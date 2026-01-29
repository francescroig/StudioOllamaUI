import { useState } from 'react';
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import ModelsPanel from "./ModelsPanel";
import HelpPanel from "./HelpPanel";
import SettingsPanel from "./SettingsPanel";
import { Settings } from 'lucide-react';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-[#0f1115] overflow-hidden">
      <Sidebar />
      <ChatArea />
      <ModelsPanel />
      <HelpPanel />
      
      {/* Botón de Configuración flotante */}
      <button 
        onClick={() => setShowSettings(true)}
        title="Configuración" 
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xl z-40 hover:bg-purple-700 transition-all hover:scale-110"
      >
        <Settings size={20} />
      </button>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}