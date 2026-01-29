import { fileService } from './fileService';

// Tipos de comandos que el modelo puede ejecutar
export type FileCommand = 
  | { type: 'read'; path: string }
  | { type: 'write'; path: string; content: string }
  | { type: 'list'; path: string }
  | { type: 'create_dir'; path: string };

/**
 * Procesa comandos de archivo embebidos en la respuesta del modelo
 * 
 * Formato esperado:
 * [FILE_READ: /ruta/archivo]
 * [FILE_WRITE: /ruta/archivo]
 * contenido aqui
 * [END_FILE_WRITE]
 * [FILE_LIST: /ruta/carpeta]
 * [FILE_CREATE_DIR: /ruta/nueva/carpeta]
 */
export class FileCommandProcessor {
  /**
   * Detecta y ejecuta comandos de archivo en el texto
   */
  static async processCommands(text: string): Promise<{
    cleanedText: string;
    results: Array<{ command: string; status: string; result?: string }>;
  }> {
    const results: Array<{ command: string; status: string; result?: string }> = [];
    let cleanedText = text;

    console.log('🔍 [FileCommandProcessor] Iniciando procesamiento de comandos...');
    console.log('📝 Longitud del texto:', text.length);

    // Procesar comandos FILE_WRITE primero (más complejos)
    const writeRegex = /\[FILE_WRITE:\s*(.+?)\]\s*([\s\S]*?)\s*\[END_FILE_WRITE\]/;
    let writeMatch;
    
    if ((writeMatch = writeRegex.exec(text)) !== null) {
      const filePath = writeMatch[1].trim();
      const content = writeMatch[2].trim();

      console.log('✍️  [FileCommandProcessor] Encontrado FILE_WRITE');
      console.log('   Ruta:', filePath);
      console.log('   Contenido (primeros 100 chars):', content.substring(0, 100));

      try {
        await fileService.writeFile(filePath, content);
        results.push({
          command: `FILE_WRITE: ${filePath}`,
          status: '✓ Éxito',
          result: `Archivo guardado: ${filePath} (${content.length} caracteres)`
        });
        console.log('✅ [FileCommandProcessor] Archivo guardado exitosamente');
        
        // Limpiar el comando del texto
        cleanedText = cleanedText.replace(writeMatch[0], '');
      } catch (error) {
        console.error('❌ [FileCommandProcessor] Error al escribir archivo:', error);
        results.push({
          command: `FILE_WRITE: ${filePath}`,
          status: '✗ Error',
          result: String(error)
        });
      }
    } else {
      console.log('ℹ️  [FileCommandProcessor] No se encontraron comandos FILE_WRITE');
    }

    // Procesar otros comandos FILE_READ, FILE_LIST, FILE_CREATE_DIR
    const otherRegex = /\[FILE_(READ|LIST|CREATE_DIR):\s*(.+?)\]/g;
    let otherMatch;
    let foundOther = false;
    
    while ((otherMatch = otherRegex.exec(text)) !== null) {
      foundOther = true;
      const command = otherMatch[1];
      const path = otherMatch[2].trim();

      console.log(`📂 [FileCommandProcessor] Encontrado FILE_${command}`);
      console.log('   Ruta:', path);

      try {
        switch (command) {
          case 'READ': {
            const content = await fileService.readFile(path);
            results.push({
              command: `FILE_READ: ${path}`,
              status: '✓ Éxito',
              result: `Archivo leído (${content.length} caracteres)`
            });
            // Reemplazar con el contenido real del archivo en un formato muy claro
            cleanedText = cleanedText.replace(otherMatch[0], `[ARCHIVO_LEÍDO]\nRuta: ${path}\nContenido:\n${content}\n[FIN_ARCHIVO]`);
            console.log('✅ Archivo leído exitosamente:', content.substring(0, 100));
            break;
          }

          case 'LIST': {
            const files = await fileService.listFiles(path);
            const fileList = files.map(f => `  - ${f.name} (${f.type})`).join('\n');
            results.push({
              command: `FILE_LIST: ${path}`,
              status: '✓ Éxito',
              result: `${files.length} items encontrados`
            });
            cleanedText = cleanedText.replace(otherMatch[0], `[Carpeta ${path}:\n${fileList}]`);
            console.log('✅ Carpeta listada exitosamente');
            break;
          }

          case 'CREATE_DIR': {
            await fileService.createDirectory(path);
            results.push({
              command: `FILE_CREATE_DIR: ${path}`,
              status: '✓ Éxito',
              result: `Directorio creado`
            });
            cleanedText = cleanedText.replace(otherMatch[0], '');
            console.log('✅ Directorio creado exitosamente');
            break;
          }
        }
      } catch (error) {
        console.error(`❌ [FileCommandProcessor] Error en FILE_${command}:`, error);
        results.push({
          command: `FILE_${command}: ${path}`,
          status: '✗ Error',
          result: String(error)
        });
      }
    }

    if (!foundOther) {
      console.log('ℹ️  [FileCommandProcessor] No se encontraron otros comandos de archivo');
    }

    console.log('✅ [FileCommandProcessor] Procesamiento completado');
    console.log('   Total de operaciones:', results.length);
    if (results.length > 0) {
      console.log('   Resultados:', results);
    }

    return { cleanedText, results };
  }

  /**
   * Inyecta instrucciones en el prompt del sistema para que el modelo use estos comandos
   */
  static getSystemPromptAddition(): string {
    return `
## SISTEMA DE MANEJO DE ARCHIVOS

Tienes acceso a un sistema de lectura y escritura de archivos. Los comandos se procesan automáticamente.

### LEER ARCHIVO:
Cuando necesites leer un archivo, usa:
[FILE_READ: /ruta/completa/archivo.txt]

El sistema leerá el archivo y reemplazará tu comando con:
[ARCHIVO_LEÍDO]
Ruta: /ruta/completa/archivo.txt
Contenido:
<contenido real del archivo aquí>
[FIN_ARCHIVO]

IMPORTANTE: Cuando veas [ARCHIVO_LEÍDO]...[FIN_ARCHIVO], ese es el contenido REAL del archivo. Debes procesar y analizar ese contenido exacto, no generar contenido ficticio.

### ESCRIBIR ARCHIVO (crear o sobrescribir):
[FILE_WRITE: /ruta/completa/archivo.txt]
contenido que deseas guardar
[END_FILE_WRITE]

### LISTAR CARPETA:
[FILE_LIST: /ruta/carpeta]

### CREAR DIRECTORIO:
[FILE_CREATE_DIR: /ruta/nueva/carpeta]

NOTAS IMPORTANTES:
- Usa rutas ABSOLUTAS (ej: C:\\Users\\francesc\\WorkFolder\\archivo.txt en Windows)
- Los comandos se procesan automáticamente después de tu respuesta
- Cuando leas archivos, analiza el contenido REAL entre [ARCHIVO_LEÍDO] y [FIN_ARCHIVO]
- No inventes contenido de archivos, siempre usa los comandos para leer
`;
  }
}
