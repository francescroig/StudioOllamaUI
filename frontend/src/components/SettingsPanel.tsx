/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { useStore } from '../store';
import { useTranslation } from '../i18n';
import { X, Key, Server, Globe, Settings as SettingsIcon, LogIn } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const state = useStore();
  const { t } = useTranslation();
  const [signingIn, setSigningIn] = useState(false);
  const [signInStatus, setSignInStatus] = useState('');

  const handleOllamaSignIn = async () => {
    setSigningIn(true);
    setSignInStatus(t('startingSignIn'));

    try {
      const response = await fetch('http://localhost:3001/api/ollama/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success && data.authUrl) {
        setSignInStatus(t('openingBrowser'));
        
        // Abrir la URL en el navegador
        window.open(data.authUrl, '_blank');
        
        setTimeout(() => {
          setSignInStatus(t('signInComplete'));
        }, 1000);
      } else {
        console.error('Error en ollama signin:', data);
        setSignInStatus(t('signInError'));
      }
    } catch (error) {
      console.error('Error ejecutando ollama signin:', error);
      setSignInStatus(t('signInError'));
    } finally {
      setSigningIn(false);
      setTimeout(() => setSignInStatus(''), 5000);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1c23] w-full max-w-md rounded-xl border border-gray-800 p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <SettingsIcon size={18}/> {t('globalSettings')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20}/>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Ollama Config */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
              <Server size={12}/> {t('ollamaConfig')}
            </label>
            <input 
              type="text" 
              placeholder={t('ollamaUrl')}
              value={state.ollamaConfig.apiUrl || ''} 
              onChange={(e) => state.setOllamaConfig({apiUrl: e.target.value})} 
              className="w-full bg-black/20 border border-gray-700 rounded p-2.5 text-white text-xs outline-none focus:border-blue-500"
            />
            
            {/* Botón de Ollama Sign In */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded p-3">
              <p className="text-[10px] text-blue-300 mb-2">
                <strong>☁️ {t('cloudModels')}:</strong> {t('cloudModelsDesc')}
              </p>
              <button
                onClick={handleOllamaSignIn}
                disabled={signingIn}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-3 rounded flex items-center justify-center gap-2 transition-all text-xs font-bold"
              >
                <LogIn size={14} />
                {signingIn ? t('signingIn') : t('ollamaSignIn')}
              </button>
              {signInStatus && (
                <p className="text-[10px] text-center mt-2 text-green-400">
                  {signInStatus}
                </p>
              )}
            </div>
          </div>

          {/* Search APIs */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
              <Globe size={12}/> {t('searchApiKeys')}
            </label>
            
            <div className="space-y-2">
              <input 
                type="password" 
                placeholder={t('tavilyKey')}
                value={state.searchAPIs.tavily || ''} 
                onChange={(e) => state.setSearchAPIs({...state.searchAPIs, tavily: e.target.value})} 
                className="w-full bg-black/20 border border-gray-700 rounded p-2.5 text-white text-xs outline-none focus:border-blue-500"
              />
              
              <input 
                type="password" 
                placeholder={t('googleKey')}
                value={state.searchAPIs.google || ''} 
                onChange={(e) => state.setSearchAPIs({...state.searchAPIs, google: e.target.value})} 
                className="w-full bg-black/20 border border-gray-700 rounded p-2.5 text-white text-xs outline-none focus:border-blue-500"
              />
              
              <input 
                type="password" 
                placeholder={t('bingKey')}
                value={state.searchAPIs.bing || ''} 
                onChange={(e) => state.setSearchAPIs({...state.searchAPIs, bing: e.target.value})} 
                className="w-full bg-black/20 border border-gray-700 rounded p-2.5 text-white text-xs outline-none focus:border-blue-500"
              />
              
              <div className="bg-blue-900/20 border border-blue-700/30 rounded p-2 text-[10px] text-blue-300">
                <span className="font-bold">ℹ️ {t('duckduckgoNoKey')}:</span> {t('duckduckgoNoKeyMsg')}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-800/30 border border-gray-700 rounded p-3 text-[10px] text-gray-400">
            <p><strong className="text-gray-300">Search APIs:</strong> {t('searchApisInfo')}</p>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full bg-blue-600 text-white py-2.5 rounded font-bold transition-colors hover:bg-blue-500"
        >
          {t('saveSettings')}
        </button>
      </div>
    </div>
  );
}
