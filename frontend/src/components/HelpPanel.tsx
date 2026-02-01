/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import React from "react";
import { HelpCircle } from "lucide-react";
import { useTranslation } from '../i18n';

export default function HelpPanel() {
  const { t } = useTranslation();
  
  const openHelp = () => {
    window.open("http://localhost:3001/help/help.html", "StudioOllamaUI_Help", "width=1200,height=800");
  };

  return (
    <button 
      onClick={openHelp} 
      title={t('help')}
      className="fixed bottom-20 right-6 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xl z-40 hover:bg-emerald-700 transition-all hover:scale-110"
    >
      <HelpCircle size={20} />
    </button>
  );
}