import { fileService } from './fileService';

export class FileUploadService {
  /**
   * Sube un archivo a una ruta específica
   */
  static async uploadFile(file: File, destinationPath: string): Promise<boolean> {
    try {
      // Limpiar la ruta (remover comillas si las tiene)
      const cleanPath = destinationPath.replace(/"/g, '').trim();
      
      console.log('📤 Subiendo archivo:', file.name, 'Tamaño:', file.size, 'A:', cleanPath);
      
      // Leer el archivo como texto
      let content: string;
      
      try {
        content = await file.text();
      } catch (e) {
        // Si falla, intentar como base64
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Extraer el base64 después de la coma
            const base64 = result.split(',')[1] || result;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const fileName = file.name;
      const fullPath = `${cleanPath}\\${fileName}`;
      
      console.log('📝 Escribiendo en:', fullPath);
      
      await fileService.writeFile(fullPath, content);
      
      console.log('✅ Archivo subido exitosamente:', fileName);
      return true;
    } catch (error) {
      console.error('❌ Error subiendo archivo:', file.name, error);
      throw error;
    }
  }

  /**
   * Sube múltiples archivos
   */
  static async uploadMultipleFiles(files: File[], destinationPath: string): Promise<{
    successful: string[];
    failed: { name: string; error: string }[];
  }> {
    const results = {
      successful: [] as string[],
      failed: [] as { name: string; error: string }[],
    };

    for (const file of files) {
      try {
        await this.uploadFile(file, destinationPath);
        results.successful.push(file.name);
      } catch (error) {
        results.failed.push({
          name: file.name,
          error: String(error),
        });
      }
    }

    return results;
  }
}
