import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Send, Square, Loader2, FileText, Code, Globe, WifiOff, Terminal, Copy, Check } from 'lucide-react';
import { ollamaService } from '../api/ollamaService';
import { searchService } from '../api/searchService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

export default function ChatArea() {
  const state = useStore();
  const [input, setInput] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  useEffect(() => {
    ollamaService.setConfig(state.ollamaConfig.apiUrl, state.ollamaConfig.apiKey);
  }, [state.ollamaConfig]);

  useEffect(() => {
    searchService.setApiKeys(state.searchAPIs);
  }, [state.searchAPIs]);

  const exportMessage = (content: string, type: 'txt' | 'html') => {
    const blob = new Blob([content], { type: type === 'txt' ? 'text/plain' : 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `message-${Date.now()}.${type}`;
    a.click();
  };

  // Extraer comandos de Windows del texto
  const extractWindowsCommands = (text: string): string[] => {
    const commands: string[] = [];
    
    // Patrones de comandos comunes de Windows
    const patterns = [
      // Comandos en bloques de código
      /```(?:cmd|powershell|batch|ps1)?\s*\n(.*?)\n```/gis,
      // Comandos en línea con backticks
      /`([^`]+)`/g,
      // Comandos explícitos (defrag, chkdsk, sfc, etc.)
      /\b(defrag|chkdsk|sfc|dism|diskpart|powercfg|netsh|ipconfig|systeminfo|tasklist|taskkill|wmic|reg|net|shutdown|gpupdate)\s+[^\n]*/gi
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const cmd = (match[1] || match[0]).trim();
        if (cmd && cmd.length > 3 && !commands.includes(cmd)) {
          commands.push(cmd);
        }
      }
    });

    return commands;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(text);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const openCommandInTerminal = (command: string) => {
    // Intentar abrir CMD con el comando
    const cmdCommand = `start cmd.exe /k "${command}"`;
    
    // Usar el servidor para ejecutar
    fetch('http://localhost:3001/api/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmdCommand })
    }).catch(err => {
      console.error('Error abriendo terminal:', err);
      alert('No se pudo abrir la terminal. Copia el comando manualmente.');
    });
  };

  const performWebSearch = async (query: string) => {
    setSearchStatus('🌐 Buscando en la web...');
    
    try {
      const results = await searchService.search(query, state.searchEngine);
      
      if (results.length === 0) {
        setSearchStatus('❌ No se encontraron resultados');
        setTimeout(() => setSearchStatus(''), 3000);
        return null;
      }

      setSearchStatus(`✅ ${results.length} resultados encontrados`);
      setTimeout(() => setSearchStatus(''), 2000);
      
      return {
        formatted: searchService.formatSearchResults(results),
        sources: results.map(r => ({ title: r.title, url: r.url }))
      };
    } catch (error: any) {
      console.error('Error en búsqueda web:', error);
      
      const errorMsg = error.message || '';
      
      if (errorMsg.includes('API key no configurada')) {
        setSearchStatus('⚠️ ' + errorMsg);
      } else if (errorMsg.includes('Network') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('timeout')) {
        setSearchStatus('❌ Error estableciendo conexión a la red');
      } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
        setSearchStatus('❌ API Key inválida o expirada');
      } else {
        setSearchStatus('❌ ' + (errorMsg || 'Error en la búsqueda web'));
      }
      
      setTimeout(() => setSearchStatus(''), 5000);
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || state.isGenerating) return;
    if (!state.selectedModel) {
      alert('Por favor selecciona un modelo primero');
      return;
    }

    const userMessage = { role: 'user', content: input.trim() };
    state.addMessage(userMessage);
    const userQuery = input.trim();
    setInput('');
    state.setIsGenerating(true);

    try {
      let contextMessages = [...state.messages, userMessage];

      // Añadir prompt global si existe
      if (state.globalPrompt && state.globalPrompt.trim()) {
        const globalSystemPrompt = {
          role: 'system' as const,
          content: state.globalPrompt.trim()
        };
        contextMessages = [globalSystemPrompt, ...contextMessages];
      }

      // Si búsqueda web está activada
      let searchMetadata = null;
      if (state.webSearchEnabled) {
        const searchData = await performWebSearch(userQuery);
        
        if (searchData) {
          // Añadir contexto de búsqueda al mensaje del sistema
          const searchContext = {
            role: 'system' as const,
            content: `El usuario ha preguntado: "${userQuery}"\n\nResultados de búsqueda web (${state.searchEngine}):\n${searchData.formatted}\n\nUsa esta información para responder de manera precisa y actualizada. IMPORTANTE: Cita las fuentes relevantes en tu respuesta.`
          };
          contextMessages = [searchContext, ...contextMessages];
          searchMetadata = {
            engine: state.searchEngine,
            sources: searchData.sources
          };
        }
      }

      // Añadir mensaje del asistente vacío con metadata
      state.addMessage({ 
        role: 'assistant', 
        content: '',
        model: state.selectedModel,
        searchMetadata: searchMetadata
      });

      let fullResponse = '';
      
      await ollamaService.generateResponse(
        state.selectedModel,
        contextMessages,
        (chunk: string, stats?: any) => {
          if (stats) {
            // Actualizar tokens
            const currentTokens = state.tokenStats?.totalTokens || 0;
            const newTokens = (stats.promptTokens || 0) + (stats.completionTokens || 0);
            state.setTokenStats({ totalTokens: currentTokens + newTokens });
          } else {
            fullResponse += chunk;
            state.updateLastMessage(fullResponse);
          }
        },
        state.reasoningLevel === 'fast' ? 'low' : state.reasoningLevel === 'deep' ? 'high' : 'medium',
        state.criticalMode
      );
    } catch (error: any) {
      console.error('Error generating response:', error);
      
      if (error.message?.includes('fetch')) {
        state.updateLastMessage('❌ Error: No se pudo conectar con Ollama. Verifica que el servidor esté corriendo.');
      } else {
        state.updateLastMessage('❌ Error: ' + error.message);
      }
    } finally {
      state.setIsGenerating(false);
      setSearchStatus('');
    }
  };

  const handleStop = () => {
    ollamaService.cancelGeneration();
    state.setIsGenerating(false);
    setSearchStatus('');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0c10] h-screen overflow-hidden relative">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4">
        {state.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-xl mb-2">👋 ¡Hola!</p>
              <p className="text-sm">Escribe un mensaje para comenzar</p>
              {state.webSearchEnabled && (
                <p className="text-xs mt-2 text-blue-400 flex items-center justify-center gap-2">
                  <Globe size={14} />
                  Búsqueda web activada ({state.searchEngine})
                </p>
              )}
            </div>
          </div>
        ) : (
          state.messages.map((m: any, i: number) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
              <div className="flex flex-col gap-2 max-w-[85%] min-w-0 w-auto">
                <div 
                  className={`p-4 rounded-2xl break-words overflow-wrap-anywhere ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#1a1c23] text-gray-200 border border-gray-800'
                  }`}
                >
                  {m.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none break-words overflow-auto">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            return inline ? (
                              <code className="bg-gray-800 px-1 py-0.5 rounded text-xs break-all" {...props}>
                                {children}
                              </code>
                            ) : (
                              <div className="overflow-x-auto">
                                <code className={`${className} block whitespace-pre-wrap break-words`} {...props}>
                                  {children}
                                </code>
                              </div>
                            );
                          },
                          pre({node, children, ...props}) {
                            return (
                              <pre className="overflow-x-auto whitespace-pre-wrap break-words" {...props}>
                                {children}
                              </pre>
                            );
                          }
                        }}
                      >
                        {m.content || '...'}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                
                {/* Botones de exportación y metadata debajo de cada mensaje */}
                {m.content && (
                  <div className="space-y-1">
                    {/* Botones de exportación */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => exportMessage(m.content, 'txt')}
                        className="bg-[#1a1c23]/80 hover:bg-gray-700 text-gray-400 px-2 py-1 rounded border border-gray-800 flex items-center gap-1 text-[9px] font-bold transition-all"
                      >
                        <FileText size={10}/> TXT
                      </button>
                      <button 
                        onClick={() => exportMessage(m.content, 'html')}
                        className="bg-[#1a1c23]/80 hover:bg-gray-700 text-gray-400 px-2 py-1 rounded border border-gray-800 flex items-center gap-1 text-[9px] font-bold transition-all"
                      >
                        <Code size={10}/> HTML
                      </button>
                    </div>

                    {/* Metadata: Modelo usado */}
                    {m.role === 'assistant' && m.model && (
                      <div className="text-[9px] text-gray-500 font-mono">
                        🤖 {m.model}
                      </div>
                    )}

                    {/* Metadata: Fuentes de búsqueda web */}
                    {m.searchMetadata && m.searchMetadata.sources && m.searchMetadata.sources.length > 0 && (
                      <div className="bg-blue-900/20 border border-blue-700/30 rounded p-2 text-[9px] space-y-1">
                        <div className="text-blue-400 font-bold uppercase flex items-center gap-1">
                          <Globe size={10} /> Fuentes ({m.searchMetadata.engine}):
                        </div>
                        {m.searchMetadata.sources.slice(0, 3).map((source: any, idx: number) => (
                          <a 
                            key={idx}
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-blue-300 hover:text-blue-200 hover:underline truncate"
                          >
                            {idx + 1}. {source.title}
                          </a>
                        ))}
                        {m.searchMetadata.sources.length > 3 && (
                          <div className="text-gray-500">
                            +{m.searchMetadata.sources.length - 3} más fuentes...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Comandos de Windows detectados */}
                    {m.role === 'assistant' && m.content && extractWindowsCommands(m.content).length > 0 && (
                      <div className="bg-green-900/20 border border-green-700/30 rounded p-2 space-y-2">
                        <div className="text-green-400 font-bold uppercase flex items-center gap-1 text-[9px]">
                          <Terminal size={10} /> Comandos Windows Detectados:
                        </div>
                        {extractWindowsCommands(m.content).map((cmd, idx) => (
                          <div key={idx} className="bg-black/40 rounded p-2 font-mono text-[10px] text-green-300 flex items-center justify-between gap-2">
                            <code className="flex-1 truncate">{cmd}</code>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => copyToClipboard(cmd)}
                                className="bg-green-700/30 hover:bg-green-700/50 p-1 rounded transition-all"
                                title="Copiar comando"
                              >
                                {copiedCommand === cmd ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                              <button
                                onClick={() => openCommandInTerminal(cmd)}
                                className="bg-blue-700/30 hover:bg-blue-700/50 p-1 rounded transition-all"
                                title="Abrir en CMD"
                              >
                                <Terminal size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="text-[8px] text-gray-500">
                          💡 Click en <Terminal size={8} className="inline"/> para abrir CMD con el comando
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de entrada */}
      <div className="p-4 bg-[#0b0c10] border-t border-gray-800">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input 
            className="flex-1 bg-[#1a1c23] border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-50"
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={state.isGenerating}
          />
          {state.isGenerating ? (
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-all"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || !state.selectedModel}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-all"
            >
              <Send size={18} />
            </button>
          )}
        </div>
        
        {/* Indicadores de estado */}
        {(state.isGenerating || searchStatus) && (
          <div className="max-w-4xl mx-auto mt-2 flex items-center gap-2 text-xs">
            {searchStatus ? (
              <div className={`flex items-center gap-2 ${
                searchStatus.includes('❌') ? 'text-red-400' : 
                searchStatus.includes('✅') ? 'text-green-400' : 
                searchStatus.includes('⚠️') ? 'text-yellow-400' : 
                'text-blue-400'
              }`}>
                {searchStatus.includes('estableciendo conexión') ? (
                  <WifiOff size={14} />
                ) : searchStatus.includes('Buscando') ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Globe size={14} />
                )}
                {searchStatus}
              </div>
            ) : state.isGenerating ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                Generando respuesta...
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}