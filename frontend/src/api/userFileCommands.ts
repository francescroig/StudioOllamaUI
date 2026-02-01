/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { fileService } from './fileService';

/**
 * Procesa comandos de usuario para leer archivos
 * Formato: @read /ruta/archivo.txt
 */
export class UserFileCommands {
  static async processUserCommand(input: string): Promise<{
    hasCommand: boolean;
    result?: string;
    cleanedInput: string;
  }> {
    // Detectar comando @read
    const readMatch = input.match(/@read\s+(.+?)(?:\s+|$)/);
    
    if (readMatch) {
      const filePath = readMatch[1].trim();
      console.log('📖 [UserFileCommands] Leyendo archivo:', filePath);
      
      try {
        const content = await fileService.readFile(filePath);
        const result = `\n📄 **Contenido de ${filePath}:**\n\`\`\`\n${content}\n\`\`\`\n`;
        
        // Limpiar el comando del input
        const cleanedInput = input.replace(readMatch[0], '').trim();
        
        console.log('✅ Archivo leído:', content.length, 'caracteres');
        
        return {
          hasCommand: true,
          result,
          cleanedInput: cleanedInput || 'Analiza el archivo que acabo de leer'
        };
      } catch (error) {
        console.error('❌ Error leyendo archivo:', error);
        return {
          hasCommand: true,
          result: `\n❌ Error al leer ${filePath}: ${error}\n`,
          cleanedInput: input.replace(readMatch[0], '').trim()
        };
      }
    }

    return {
      hasCommand: false,
      cleanedInput: input
    };
  }

  static getHelpText(): string {
    return `
## 📖 COMANDOS DE LECTURA DE ARCHIVOS

Puedes leer archivos directamente sin que el modelo genere comandos:

\`\`\`
@read /ruta/completa/archivo.txt
@read C:\\Users\\francesc\\WorkFolder\\documento.txt
\`\`\`

Ejemplo:
\`@read C:\\Users\\francesc\\WorkFolder\\testread.txt Analiza este archivo\`

El contenido se mostrará directamente sin alucinaciones, y el modelo solo verá el contenido real.
`;
  }
}
