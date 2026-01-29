import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(process.cwd()));

// Ejecutar comandos
app.post('/api/execute', (req: Request, res: Response) => {
  const { command, workingDir } = req.body;
  let cwd = process.cwd();
  if (workingDir && fs.existsSync(workingDir)) cwd = workingDir;
  
  exec(command, { 
    cwd, 
    shell: process.env.ComSpec || 'cmd.exe', 
    env: process.env 
  }, (error, stdout, stderr) => {
    res.json({ output: stdout, error: stderr || (error ? error.message : null) });
  });
});

app.listen(3001, () => {
  console.log('✓ Servidor activo en http://localhost:3001');
  console.log('✓ Sirviendo archivos desde:', process.cwd());
});