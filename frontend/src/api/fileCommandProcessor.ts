/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
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
 * Formato esperado (con rutas RELATIVAS):
 * [FILE_READ: archivo.txt]
 * [FILE_WRITE: nuevo.txt]
 * contenido aqui
 * [END_FILE_WRITE]
 * [FILE_LIST: subcarpeta]
 * [FILE_CREATE_DIR: nueva/carpeta]
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
        cleanedText = cleanedText.replace(writeMatch[0], `\n✅ Archivo creado: ${filePath}\n`);
      } catch (error) {
        console.error('❌ [FileCommandProcessor] Error al escribir archivo:', error);
        results.push({
          command: `FILE_WRITE: ${filePath}`,
          status: '✗ Error',
          result: String(error)
        });
        cleanedText = cleanedText.replace(writeMatch[0], `\n❌ Error creando archivo: ${error}\n`);
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
      const requestedPath = otherMatch[2].trim();

      console.log(`📂 [FileCommandProcessor] Encontrado FILE_${command}`);
      console.log('   Ruta solicitada:', requestedPath);

      try {
        switch (command) {
          case 'READ': {
            const content = await fileService.readFile(requestedPath);
            results.push({
              command: `FILE_READ: ${requestedPath}`,
              status: '✓ Éxito',
              result: `Archivo leído (${content.length} caracteres)`
            });
            // Reemplazar con el contenido real del archivo en un formato muy claro
            cleanedText = cleanedText.replace(
              otherMatch[0], 
              `\n━━━━━ ARCHIVO LEÍDO: ${requestedPath} ━━━━━\n${content}\n━━━━━ FIN DEL ARCHIVO ━━━━━\n`
            );
            console.log('✅ Archivo leído exitosamente:', content.substring(0, 100));
            break;
          }

          case 'LIST': {
            const files = await fileService.listFiles(requestedPath);
            const fileList = files.length > 0 
              ? files.map(f => `  📄 ${f.name}${f.type === 'directory' ? '/' : ''} ${f.size ? `(${f.size} bytes)` : ''}`).join('\n')
              : '  (carpeta vacía)';
            results.push({
              command: `FILE_LIST: ${requestedPath}`,
              status: '✓ Éxito',
              result: `${files.length} items encontrados`
            });
            const displayPath = requestedPath || 'WorkFolder';
            cleanedText = cleanedText.replace(
              otherMatch[0], 
              `\n━━━━━ ARCHIVOS EN: ${displayPath} ━━━━━\n${fileList}\n━━━━━ TOTAL: ${files.length} archivos ━━━━━\n`
            );
            console.log('✅ Carpeta listada exitosamente:', files.length, 'archivos');
            break;
          }

          case 'CREATE_DIR': {
            await fileService.createDirectory(requestedPath);
            results.push({
              command: `FILE_CREATE_DIR: ${requestedPath}`,
              status: '✓ Éxito',
              result: `Directorio creado`
            });
            cleanedText = cleanedText.replace(otherMatch[0], `\n✅ Carpeta creada: ${requestedPath}\n`);
            console.log('✅ Directorio creado exitosamente');
            break;
          }
        }
      } catch (error) {
        console.error(`❌ [FileCommandProcessor] Error en FILE_${command}:`, error);
        results.push({
          command: `FILE_${command}: ${requestedPath}`,
          status: '✗ Error',
          result: String(error)
        });
        cleanedText = cleanedText.replace(otherMatch[0], `\n❌ Error: ${error}\n`);
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
## 💾 SISTEMA DE ARCHIVOS SEGURO

Tienes acceso a un sistema de archivos SANDBOX en la carpeta "WorkFolder".

🔒 REGLAS DE SEGURIDAD:
- SOLO puedes acceder a archivos dentro de WorkFolder
- USA SIEMPRE rutas RELATIVAS (sin C:\\, sin rutas absolutas)
- NO uses "..", no puedes salir de WorkFolder

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📄 LISTAR ARCHIVOS:

**Para la raíz de WorkFolder:**
[FILE_LIST: .]

**Para una subcarpeta:**
[FILE_LIST: subcarpeta]

**Verás algo como:**
━━━━━ ARCHIVOS EN: WorkFolder ━━━━━
  📄 documento.txt (1024 bytes)
  📄 imagen.png (2048 bytes)
  📄 carpeta/
━━━━━ TOTAL: 3 archivos ━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📝 LEER UN ARCHIVO:

**Sintaxis:**
[FILE_READ: nombre_archivo.txt]

**Para archivo en subcarpeta:**
[FILE_READ: subcarpeta/archivo.txt]

**Verás algo como:**
━━━━━ ARCHIVO LEÍDO: documento.txt ━━━━━
Contenido real del archivo aquí...
━━━━━ FIN DEL ARCHIVO ━━━━━

⚠️ IMPORTANTE: Este es contenido REAL. No inventes contenido.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ✍️ ESCRIBIR/CREAR ARCHIVO:

**Sintaxis:**
[FILE_WRITE: nombre_archivo.txt]
Contenido que quieres escribir.
Puede tener múltiples líneas.
[END_FILE_WRITE]

**Para crear en subcarpeta:**
[FILE_WRITE: subcarpeta/nuevo.txt]
Contenido aquí
[END_FILE_WRITE]

**Verás:**
✅ Archivo creado: nombre_archivo.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📂 CREAR CARPETA:

**Sintaxis:**
[FILE_CREATE_DIR: nombre_carpeta]

**Para subcarpetas:**
[FILE_CREATE_DIR: carpeta/subcarpeta]

**Verás:**
✅ Carpeta creada: nombre_carpeta

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ❗ EJEMPLOS CORRECTOS vs INCORRECTOS:

✅ CORRECTO:
[FILE_LIST: .]
[FILE_READ: documento.txt]
[FILE_WRITE: nuevo.txt]
[FILE_READ: carpeta/archivo.txt]

❌ INCORRECTO (NO HAGAS ESTO):
[FILE_LIST: C:\\Users\\francesc\\WorkFolder]  ← NO rutas absolutas
[FILE_READ: ../../../system.txt]  ← NO puedes salir de WorkFolder
[FILE_WRITE: C:\\Windows\\archivo.txt]  ← NO rutas fuera del sandbox

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 FLUJO DE TRABAJO TÍPICO:

1. Listar archivos disponibles:
   [FILE_LIST: .]

2. Leer un archivo:
   [FILE_READ: documento.txt]

3. Procesar el contenido

4. Crear resultado:
   [FILE_WRITE: resultado.txt]
   Tu análisis aquí
   [END_FILE_WRITE]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECUERDA: Solo rutas RELATIVAS, sin "..", sin rutas absolutas.
`;
  }
}
