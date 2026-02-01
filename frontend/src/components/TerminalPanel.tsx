/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { useEffect, useRef } from 'react';
import { Terminal, X, Trash2 } from 'lucide-react';

interface TerminalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
  onClear: () => void;
}

export default function TerminalPanel({ isOpen, onClose, logs, onClear }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan nuevos logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  return (
    <div className="bg-[#0d1117] border-b border-gray-800 overflow-hidden animate-slideDown">
      {/* Header de la terminal */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-green-400" />
          <span className="text-xs font-mono text-gray-300 font-bold">
            Debug Terminal
          </span>
          <span className="text-[10px] text-gray-500">
            ({logs.length} lines)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-400"
            title="Limpiar terminal"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-red-400"
            title="Cerrar terminal"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Contenido de la terminal */}
      <div
        ref={terminalRef}
        className="h-64 overflow-y-auto overflow-x-hidden p-4 font-mono text-xs bg-black/40 custom-scrollbar"
        style={{
          fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        }}
      >
        {logs.length === 0 ? (
          <div className="text-gray-600 italic flex items-center gap-2">
            <Terminal size={14} />
            Esperando logs de generación...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {formatLogLine(log)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Formatea una línea de log con colores según el tipo
 */
function formatLogLine(log: string) {
  // Detectar tipo de log por prefijos o contenido
  if (log.startsWith('[THINK]')) {
    return (
      <span className="text-cyan-400">
        <span className="text-cyan-600">[THINK]</span> {log.substring(7)}
      </span>
    );
  }
  
  if (log.startsWith('[INFO]')) {
    return (
      <span className="text-blue-400">
        <span className="text-blue-600">[INFO]</span> {log.substring(6)}
      </span>
    );
  }
  
  if (log.startsWith('[DEBUG]')) {
    return (
      <span className="text-gray-500">
        <span className="text-gray-600">[DEBUG]</span> {log.substring(7)}
      </span>
    );
  }
  
  if (log.startsWith('[ERROR]')) {
    return (
      <span className="text-red-400">
        <span className="text-red-600 font-bold">[ERROR]</span> {log.substring(7)}
      </span>
    );
  }
  
  if (log.startsWith('[WARN]')) {
    return (
      <span className="text-yellow-400">
        <span className="text-yellow-600">[WARN]</span> {log.substring(6)}
      </span>
    );
  }
  
  if (log.startsWith('[DONE]')) {
    return (
      <span className="text-green-400">
        <span className="text-green-600">[DONE]</span> {log.substring(6)}
      </span>
    );
  }

  // Detectar reasoning tags de deepseek
  if (log.includes('<think>') || log.includes('</think>')) {
    return <span className="text-purple-400">{log}</span>;
  }

  // Detectar métricas (números seguidos de unidades)
  const metricRegex = /(\d+(?:\.\d+)?)\s*(tokens?|ms|s|%)/gi;
  if (metricRegex.test(log)) {
    return (
      <span className="text-emerald-400">
        {log.replace(metricRegex, (match) => `<span class="text-emerald-300 font-bold">${match}</span>`)}
      </span>
    );
  }

  // Log normal
  return <span className="text-gray-300">{log}</span>;
}
