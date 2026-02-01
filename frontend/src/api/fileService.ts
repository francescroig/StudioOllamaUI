/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
// Servicio centralizado para manejo de archivos
const FILE_SERVER_URL = 'http://localhost:3001';

export interface FileInfo {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size: number;
  modified: string;
}

class FileService {
  // Listar archivos en una carpeta
  async listFiles(dirPath: string): Promise<FileInfo[]> {
    try {
      const response = await fetch(
        `${FILE_SERVER_URL}/api/files/list?path=${encodeURIComponent(dirPath)}`
      );
      if (!response.ok) throw new Error(`Error listing files: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Leer contenido de un archivo
  async readFile(filePath: string): Promise<string> {
    try {
      const response = await fetch(
        `${FILE_SERVER_URL}/api/files/read?path=${encodeURIComponent(filePath)}`
      );
      if (!response.ok) throw new Error(`Error reading file: ${response.status}`);
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  // Escribir archivo (CREA o SOBRESCRIBE completo)
  async writeFile(filePath: string, content: string): Promise<boolean> {
    try {
      const payload = {
        path: filePath,
        content: content,
        mode: 'write'
      };
      
      const response = await fetch(
        `${FILE_SERVER_URL}/api/files/write`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error writing file: ${error.error || response.status}`);
      }
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  // Escribir por chunks (para archivos grandes)
  async writeFileInChunks(filePath: string, content: string, chunkSize: number = 10000): Promise<boolean> {
    try {
      // Primero eliminar el archivo si existe
      await this.deleteFile(filePath).catch(() => {}); // Ignorar error si no existe

      // Escribir en chunks
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.substring(i, i + chunkSize);
        const payload = {
          path: filePath,
          content: chunk,
          mode: 'append'
        };
        
        const response = await fetch(
          `${FILE_SERVER_URL}/api/files/write`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );
        if (!response.ok) throw new Error(`Error writing chunk: ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error('Error writing file in chunks:', error);
      throw error;
    }
  }

  // Eliminar archivo
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${FILE_SERVER_URL}/api/files/delete?path=${encodeURIComponent(filePath)}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error(`Error deleting file: ${response.status}`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Crear directorio
  async createDirectory(dirPath: string): Promise<boolean> {
    try {
      const payload = { path: dirPath };
      const response = await fetch(
        `${FILE_SERVER_URL}/api/files/create-directory`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) throw new Error(`Error creating directory: ${response.status}`);
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  }

  // Establecer directorio de trabajo
  async setWorkingDirectory(dirPath: string): Promise<boolean> {
    try {
      const payload = { path: dirPath };
      const response = await fetch(
        `${FILE_SERVER_URL}/api/config/set-directory`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) throw new Error(`Error setting directory: ${response.status}`);
      return true;
    } catch (error) {
      console.error('Error setting directory:', error);
      throw error;
    }
  }

  // Obtener directorio de trabajo actual
  async getWorkingDirectory(): Promise<string | null> {
    try {
      const response = await fetch(`${FILE_SERVER_URL}/api/config/directory`);
      if (!response.ok) throw new Error(`Error getting directory: ${response.status}`);
      const data = await response.json();
      return data.directory;
    } catch (error) {
      console.error('Error getting directory:', error);
      return null;
    }
  }
}

export const fileService = new FileService();