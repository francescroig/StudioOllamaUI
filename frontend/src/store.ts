/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper para cargar datos del localStorage
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
};

// Helper para guardar en localStorage
const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};

export const useStore = create<any>(
  persist(
    (set, get) => ({
      // Estado inicial con valores de localStorage
      messages: [],
      currentConversationId: null,
      conversations: loadFromStorage('conversations', []),
      selectedModel: loadFromStorage('selectedModel', ''),
      models: [],
      webSearchEnabled: false,
      searchEngine: loadFromStorage('searchEngine', 'tavily'),
      autoExecute: false,
      criticalMode: false,
      temperature: loadFromStorage('temperature', 0.7),
      reasoningLevel: loadFromStorage('reasoningLevel', 'standard'),
      ollamaConfig: loadFromStorage('ollamaConfig', { apiUrl: 'http://127.0.0.1:11434' }),
      searchAPIs: loadFromStorage('searchAPIs', { tavily: '', google: '', bing: '', duckduckgo: '' }),
      tokenStats: loadFromStorage('tokenStats', { totalTokens: 0, inputTokens: 0, outputTokens: 0 }),
      isGenerating: false,
      globalPrompt: loadFromStorage('globalPrompt', ''),
      workingDirectory: loadFromStorage('workingDirectory', ''),
      contextSize: loadFromStorage('contextSize', 4), // Número de pares pregunta-respuesta a recordar

      fetchModels: async () => {
        try {
          const res = await fetch(`${get().ollamaConfig.apiUrl}/api/tags`);
          const data = await res.json();
          const modelsList = data.models?.map((m: any) => m.name) || [];
          set({ models: modelsList });
          
          // Auto-seleccionar modelo si no hay ninguno seleccionado
          const currentModel = get().selectedModel;
          if (!currentModel && modelsList.length > 0) {
            // Prioridad: modelos locales pequeños primero
            const localModels = modelsList.filter((m: string) => 
              m.includes('qwen') || m.includes('phi') || m.includes('tinyllama') || 
              !m.includes(':') || m.includes(':0.6b') || m.includes(':1b') || m.includes(':3b')
            );
            
            // Seleccionar el primer modelo local o el primer modelo disponible
            const modelToSelect = localModels.length > 0 ? localModels[0] : modelsList[0];
            set({ selectedModel: modelToSelect });
            console.log('✅ Modelo auto-seleccionado:', modelToSelect);
          }
        } catch (e) { 
          console.error('Error fetching models:', e);
          set({ models: [] }); 
        }
      },

      addMessage: (msg: any) => {
        const state = get();
        const newMessages = [...state.messages, msg];
        set({ messages: newMessages });
        
        // Si hay conversación activa, actualizar su historial
        if (state.currentConversationId) {
          const convs = state.conversations.map((c: any) => 
            c.id === state.currentConversationId 
              ? { ...c, messages: newMessages, title: newMessages[0]?.content.substring(0, 30) || 'Chat Nuevo' }
              : c
          );
          set({ conversations: convs });
          saveToStorage('conversations', convs);
        }
      },

      setMessages: (messages: any[]) => {
        set({ messages });
        // No actualizar conversación guardada, solo la memoria temporal
      },

      updateLastMessage: (content: string) => {
        const state = get();
        if (state.messages.length === 0) return;
        
        const newMessages = [...state.messages];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content
        };
        set({ messages: newMessages });
        
        // Actualizar en conversación activa
        if (state.currentConversationId) {
          const convs = state.conversations.map((c: any) => 
            c.id === state.currentConversationId 
              ? { ...c, messages: newMessages }
              : c
          );
          set({ conversations: convs });
          saveToStorage('conversations', convs);
        }
      },

      setSelectedModel: (m: string) => {
        set({ selectedModel: m });
        saveToStorage('selectedModel', m);
      },
      
      setTemperature: (v: number) => {
        set({ temperature: v });
        saveToStorage('temperature', v);
      },
      
      setReasoningLevel: (v: string) => {
        set({ reasoningLevel: v });
        saveToStorage('reasoningLevel', v);
      },
      
      setWebSearchEnabled: (v: boolean) => set({ webSearchEnabled: v }),
      
      setSearchEngine: (v: string) => {
        set({ searchEngine: v });
        saveToStorage('searchEngine', v);
      },
      
      setAutoExecute: (v: boolean) => set({ autoExecute: v }),
      setCriticalMode: (v: boolean) => set({ criticalMode: v }),
      
      setOllamaConfig: (c: any) => {
        const newConfig = { ...get().ollamaConfig, ...c };
        set({ ollamaConfig: newConfig });
        saveToStorage('ollamaConfig', newConfig);
      },
      
      setSearchAPIs: (a: any) => {
        const newAPIs = { ...get().searchAPIs, ...a };
        set({ searchAPIs: newAPIs });
        saveToStorage('searchAPIs', newAPIs);
      },
      
      setIsGenerating: (v: boolean) => set({ isGenerating: v }),
      
      setTokenStats: (stats: any) => {
        set({ tokenStats: stats });
        saveToStorage('tokenStats', stats);
      },
      
      setGlobalPrompt: (prompt: string) => {
        set({ globalPrompt: prompt });
        saveToStorage('globalPrompt', prompt);
      },
      
      setWorkingDirectory: (dir: string) => {
        set({ workingDirectory: dir });
        saveToStorage('workingDirectory', dir);
      },
      
      setContextSize: (size: number) => {
        set({ contextSize: size });
        saveToStorage('contextSize', size);
      },
      
      createNewConversation: () => {
        const id = Math.random().toString(36).substring(7);
        const newConv = { id, title: 'Chat Nuevo', messages: [] };
        const newConvs = [...get().conversations, newConv];
        set({ 
          conversations: newConvs, 
          currentConversationId: id, 
          messages: [] 
        });
        saveToStorage('conversations', newConvs);
      },

      loadConversation: (id: string) => {
        const conv = get().conversations.find((c: any) => c.id === id);
        if (conv) {
          set({ 
            currentConversationId: id, 
            messages: conv.messages || [] 
          });
        }
      },

      deleteConversation: (id: string) => {
        const state = get();
        const newConvs = state.conversations.filter((c: any) => c.id !== id);
        set({ conversations: newConvs });
        saveToStorage('conversations', newConvs);
        
        // Si eliminamos la conversación activa, limpiar
        if (state.currentConversationId === id) {
          set({ currentConversationId: null, messages: [] });
        }
      },

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'studio-ollama-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        selectedModel: state.selectedModel,
        searchEngine: state.searchEngine,
        temperature: state.temperature,
        reasoningLevel: state.reasoningLevel,
        ollamaConfig: state.ollamaConfig,
        searchAPIs: state.searchAPIs,
        tokenStats: state.tokenStats,
        globalPrompt: state.globalPrompt,
        workingDirectory: state.workingDirectory,
      }),
    }
  )
);