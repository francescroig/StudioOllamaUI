/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { FileCommandProcessor } from "./fileCommandProcessor";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Variable global para almacenar la URL de Ollama
let OLLAMA_BASE = "http://localhost:11434";
let OLLAMA_API_KEY = "";

// Variable global para almacenar el AbortController actual
let currentAbortController: AbortController | null = null;

export const ollamaService = {
  // Establecer configuración de Ollama
  setConfig(apiUrl: string, apiKey?: string) {
    OLLAMA_BASE = apiUrl || "http://localhost:11434";
    OLLAMA_API_KEY = apiKey || "";
    console.log('✅ Configuración de Ollama actualizada:', { apiUrl, hasKey: !!apiKey });
  },

  // Obtener configuración actual
  getConfig() {
    return {
      apiUrl: OLLAMA_BASE,
      hasApiKey: !!OLLAMA_API_KEY
    };
  },

  // Obtener modelos disponibles
  async getAvailableModels(): Promise<string[]> {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (OLLAMA_API_KEY) {
        headers["Authorization"] = `Bearer ${OLLAMA_API_KEY}`;
      }

      const res = await fetch(`${OLLAMA_BASE}/api/tags`, { headers });
      if (!res.ok) return [];

      const json = await res.json();
      return Array.isArray(json.models)
        ? json.models.map((m: any) => m.name)
        : [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  },

  // Generar respuesta del modelo
  async generateResponse(
    model: string | null,
    messages: ChatMessage[],
    onStream: (chunk: string, stats?: any) => void,
    reasoningLevel: 'low' | 'medium' | 'high' = 'medium',
    criticalMode: boolean = false,
    onLog?: (log: string) => void  // Nuevo callback para logs
  ) {
    const safeModel =
      model && model.trim().length > 0 ? model : "deepseek-r1:14b";

    const safeMessages = messages.filter(
      m =>
        m &&
        typeof m === "object" &&
        typeof m.role === "string" &&
        typeof m.content === "string"
    );

    // Inyectar system prompt
    const systemPrompt: ChatMessage = {
      role: "system",
      content: criticalMode
        ? `Eres un asistente altamente preciso y meticuloso en MODO DE REVISIÓN EXHAUSTIVA. 

INSTRUCCIONES CRÍTICAS:
1. VERIFICA cada afirmación antes de responder
2. CITA fuentes cuando sea posible
3. INDICA niveles de certeza (100%, ~90%, posiblemente, etc.)
4. SEÑALA si algo es una suposición o hecho verificado
5. REVISA la lógica de tu razonamiento
6. ADMITE cuando no estés seguro de algo
7. PRIORIZA la precisión sobre la velocidad
8. CUESTIONA tus propias conclusiones antes de responder

Si hay búsqueda web activa, usa las fuentes proporcionadas y cítalas explícitamente.
Si no tienes información verificable, dilo claramente.`
        : `Eres un asistente útil y conciso. Respondes de forma directa y precisa.`
    };

    const hasSystemMessage = safeMessages.some(m => m.role === "system");
    const messagesWithSystem = hasSystemMessage 
      ? safeMessages 
      : [systemPrompt, ...safeMessages];

    currentAbortController = new AbortController();
    const abortController = currentAbortController;

    try {
      const reasoningParams = {
        low: { num_ctx: 2048 },
        medium: { num_ctx: 4096 },
        high: { num_ctx: 8192 }
      };

      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (OLLAMA_API_KEY) {
        headers["Authorization"] = `Bearer ${OLLAMA_API_KEY}`;
      }

      const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: safeModel,
          messages: messagesWithSystem,
          stream: true,
          options: reasoningParams[reasoningLevel],
        }),
        signal: abortController.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(`Ollama error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let thinkingBuffer = "";  // Buffer para contenido de <think>
      let insideThink = false;
      let chunkCount = 0;
      let startTime = Date.now();
      
      // Log inicial (en inglés - universal)
      if (onLog) {
        onLog(`[INFO] Starting generation with model: ${safeModel}`);
        onLog(`[INFO] Reasoning level: ${reasoningLevel} (context: ${reasoningParams[reasoningLevel].num_ctx} tokens)`);
        if (criticalMode) onLog(`[WARN] Critical mode enabled - exhaustive verification active`);
        onLog(`[INFO] Messages in context: ${messagesWithSystem.length}`);
      }
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            
            // CAPTURA DE TOKENS: Si Ollama indica que terminó, enviamos las estadísticas
            if (json.done) {
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
              
              if (onLog) {
                onLog(`[DONE] Generation completed in ${elapsed}s`);
                onLog(`[INFO] Total chunks received: ${chunkCount}`);
                if (json.prompt_eval_count) {
                  onLog(`[INFO] Input tokens: ${json.prompt_eval_count}`);
                }
                if (json.eval_count) {
                  onLog(`[INFO] Output tokens: ${json.eval_count}`);
                  const tokensPerSecond = (json.eval_count / parseFloat(elapsed)).toFixed(1);
                  onLog(`[INFO] Speed: ${tokensPerSecond} tokens/s`);
                }
                if (json.total_duration) {
                  const seconds = (json.total_duration / 1000000000).toFixed(2);
                  onLog(`[INFO] Total duration (server): ${seconds}s`);
                }
              }
              
              onStream("", {
                promptTokens: json.prompt_eval_count || 0,
                completionTokens: json.eval_count || 0
              });
            }

            const chunk = json?.message?.content;
            if (typeof chunk === "string" && chunk.length > 0) {
              chunkCount++;
              
              // Log cada 50 chunks para no saturar
              if (onLog && chunkCount % 50 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                onLog(`[DEBUG] Procesados ${chunkCount} chunks en ${elapsed}s`);
              }
              
              // Detectar y capturar contenido de <think>
              if (chunk.includes('<think>')) {
                insideThink = true;
                if (onLog) onLog('[THINK] 🧠 Iniciando cadena de razonamiento...');
              }
              
              if (insideThink) {
                thinkingBuffer += chunk;
                
                // Enviar logs línea por línea del pensamiento
                if (onLog && chunk.includes('\n')) {
                  const lines = thinkingBuffer.split('\n');
                  thinkingBuffer = lines.pop() || '';
                  lines.forEach(line => {
                    const cleanLine = line.replace(/<\/?think>/g, '').trim();
                    if (cleanLine) onLog(`[THINK] ${cleanLine}`);
                  });
                }
              }
              
              if (chunk.includes('</think>')) {
                insideThink = false;
                if (onLog) onLog('[THINK] ✅ Razonamiento completado');
                thinkingBuffer = "";
              }
              
              onStream(chunk);
            }
          } catch {
            // ignorar fragmentos parciales
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        onStream('\n\n⚠️ Generación cancelada por el usuario');
      } else {
        throw error;
      }
    } finally {
      if (currentAbortController === abortController) {
        currentAbortController = null;
      }
    }
  },

  cancelGeneration() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
  },

  isGenerating(): boolean {
    return currentAbortController !== null;
  },
};