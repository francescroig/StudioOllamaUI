/**
 * StudioOllamaUI  Copyright (C) 2026  francescroig
 * This program comes with ABSOLUTELY NO WARRANTY.
 * This is free software, and you are welcome to redistribute it
 * under certain conditions; see the LICENSE file for details.
 */
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import multer from 'multer'; 
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

// Configuración de multer para subidas temporales
const upload = multer({ dest: 'temp/' });

app.use(cors());
app.use(express.json());

// 🔒 RUTAS Y SANDBOX
const SANDBOX_DIR = path.join(__dirname, '..', 'WorkFolder');
const ROOT_DIR = path.resolve(__dirname, '..', '..');

console.log('🔒 Sandbox stablished in:', SANDBOX_DIR);
console.log('📂 Root folder detected:', ROOT_DIR);

// Asegurar directorios base
if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}
if (!fs.existsSync('temp/')) {
  fs.mkdirSync('temp/', { recursive: true });
}

/**
 * 🔒 FUNCIÓN DE SEGURIDAD CRÍTICA
 */
function validateAndResolvePath(userPath: string): string | null {
  try {
    if (!userPath || userPath === '.' || userPath === '/') return SANDBOX_DIR;
    let cleanPath = userPath.replace(/^[\/\\]+/, '');
    const fullPath = path.resolve(SANDBOX_DIR, cleanPath);
    if (!fullPath.startsWith(SANDBOX_DIR)) return null;
    return fullPath;
  } catch (error) {
    return null;
  }
}

// 🛡️ Middleware de Seguridad (CSP) - ACTUALIZADO para permitir botones externos
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https://a.fsdn.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
  );
  next();
});

// Silenciar error de favicon (responde vacío)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// 📂 SERVIDORES ESTÁTICOS
// 1. Frontend
app.use(express.static(path.join(__dirname, '..')));
// 2. Carpeta Help en la raíz
app.use('/help', express.static(path.join(ROOT_DIR, 'Help')));

// --- RUTAS DE API ---

// Endpoint para ejecutar ollama signin
app.post('/api/ollama/signin', (req: Request, res: Response) => {
  console.log('🔐 Doing ollama signin...');
  
  exec('ollama signin', { 
    shell: process.env.ComSpec || 'cmd.exe', 
    env: process.env 
  }, (error, stdout, stderr) => {
    const output = stdout + stderr;
    console.log('📤 Exit from ollama signin:', output);
    
    // Buscar la URL de autenticación
    const urlMatch = output.match(/https:\/\/ollama\.com\/[^\s\)]+/);
    
    if (urlMatch) {
      const authUrl = urlMatch[0];
      console.log('✅  Authorization URL found:', authUrl);
      res.json({ 
        success: true, 
        authUrl,
        output 
      });
    } else if (error) {
      console.error('❌ Error executing ollama signin:', error.message);
      res.json({ 
        success: false, 
        error: error.message,
        output 
      });
    } else {
      console.warn('⚠️ No URL found in output');
      res.json({ 
        success: false, 
        error: 'No authentication URL found',
        output 
      });
    }
  });
});

app.post('/api/execute', (req: Request, res: Response) => {
  const { command } = req.body;
  exec(command, { 
    cwd: SANDBOX_DIR, 
    shell: process.env.ComSpec || 'cmd.exe', 
    env: process.env 
  }, (error, stdout, stderr) => {
    res.json({ output: stdout, error: stderr || (error ? error.message : null) });
  });
});

app.get('/api/config/directory', (req: Request, res: Response) => {
  res.json({ directory: 'WorkFolder', absolutePath: SANDBOX_DIR });
});

app.get('/api/files/list', (req: Request, res: Response) => {
  const userPath = (req.query.path as string) || '';
  const safePath = validateAndResolvePath(userPath);
  if (!safePath || !fs.existsSync(safePath)) return res.status(404).json({ error: 'Not found' });
  try {
    const files = fs.readdirSync(safePath).map(name => {
      const fullPath = path.join(safePath, name);
      const stats = fs.statSync(fullPath);
      return {
        name,
        type: stats.isDirectory() ? 'directory' : 'file',
        path: path.relative(SANDBOX_DIR, fullPath) || '.',
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    });
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/read', (req: Request, res: Response) => {
  const userPath = req.query.path as string;
  const safePath = userPath ? validateAndResolvePath(userPath) : null;
  if (!safePath || !fs.existsSync(safePath)) return res.status(404).json({ error: 'Not found' });
  try {
    const content = fs.readFileSync(safePath, 'utf-8');
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🛠️ CORREGIDO: Bloque con sintaxis explícita para evitar errores
app.post('/api/files/write', (req: Request, res: Response) => {
  const { path: userPath, content, mode } = req.body;
  const safePath = userPath ? validateAndResolvePath(userPath) : null;
  if (!safePath) return res.status(403).json({ error: 'Dennied access' });
  
  try {
    const dir = path.dirname(safePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (mode === 'append') {
      fs.appendFileSync(safePath, content, 'utf-8');
    } else {
      fs.writeFileSync(safePath, content, 'utf-8');
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/files/delete', (req: Request, res: Response) => {
  const userPath = req.query.path as string;
  const safePath = userPath ? validateAndResolvePath(userPath) : null;
  if (!safePath || !fs.existsSync(safePath)) return res.status(404).json({ error: 'No exists' });
  try {
    fs.unlinkSync(safePath);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/import', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file exists' });
  try {
    const destinationName = req.body.destinationName || req.file.originalname;
    const safePath = validateAndResolvePath(destinationName);
    if (!safePath) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Out of sandbox' });
    }
    fs.renameSync(req.file.path, safePath);
    res.json({ success: true, path: destinationName });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/import-folder', (req: Request, res: Response) => {
  const { sourcePath, destinationName } = req.body;
  if (!sourcePath || !destinationName || !fs.existsSync(sourcePath)) {
    return res.status(400).json({ error: 'Error in database or origin' });
  }
  try {
    const destPath = path.join(SANDBOX_DIR, destinationName);
    if (!destPath.startsWith(SANDBOX_DIR)) return res.status(403).json({ error: 'No valid destiny' });
    copyFolderRecursive(sourcePath, destPath);
    res.json({ success: true, path: destinationName });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function copyFolderRecursive(source: string, target: string) {
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
  fs.readdirSync(source).forEach(file => {
    const sPath = path.join(source, file);
    const tPath = path.join(target, file);
    if (fs.statSync(sPath).isDirectory()) {
      copyFolderRecursive(sPath, tPath);
    } else {
      fs.copyFileSync(sPath, tPath);
    }
  });
}

app.listen(3001, () => {
  console.log('✓ Server active in http://localhost:3001');
  console.log('❓ Help in: http://localhost:3001/help/help.html');
});