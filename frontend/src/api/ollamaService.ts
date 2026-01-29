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
    criticalMode: boolean = false
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
        : `Eres un asistente útil y conciso. Respondes de forma directa y precisa.

Si el usuario pide ejecutar comandos de Windows (defragmentar, limpiar disco, ver procesos, etc.), proporciona el comando exacto para CMD o PowerShell de Windows, no para Linux.`
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
              onStream("", {
                promptTokens: json.prompt_eval_count || 0,
                completionTokens: json.eval_count || 0
              });
            }

            const chunk = json?.message?.content;
            if (typeof chunk === "string") {
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