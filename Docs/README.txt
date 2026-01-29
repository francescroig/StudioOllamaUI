# OllaGPT PORTABLE v1.0

Una aplicación completa de IA sin conexión a internet. Todo funciona localmente en tu máquina.
Necesitas conexion a Internet si quieres usar los modelo cloud o la busqueda web integrada.

## 🚀 INICIO RÁPIDO

### Para iniciar:
1. **Haz doble clic en `iniciar.bat`**
2. Se abrirán automáticamente 3 ventanas (minimizadas):
   - Ollama Server (API de IA)
   - File Server (servidor de archivos)
   - Frontend Vite (aplicación web)
3. Se abrirá Firefox automáticamente en `http://localhost:5173`

### Para detener:
1. **Haz doble clic en `detener.bat`** O
2. Cierra manualmente las 3 ventanas de servicios

---

## 📋 REQUISITOS

✓ Windows 7 o superior  
✓ 8GB RAM mínimo (16GB recomendado)  
✓ 20GB espacio libre (para modelos)  
✓ GPU NVIDIA (opcional, pero recomendada para velocidad)

---

## 🎯 CARACTERÍSTICAS

- **Ollama** - Motor de IA local basado en LLaMA
- **Frontend Web** - Interfaz moderna con React + Tailwind
- **Modelos Precargados** - Puedes usar inmediatamente
- **Servidor de Archivos** - Acceso a documentos locales
- **Firefox Portable** - No necesita instalar nada

---

## 📁 ESTRUCTURA

```
OllaGPTportable/
├── iniciar.bat              ← HAZ CLIC AQUÍ PARA EMPEZAR
├── detener.bat              ← Para detener todo
├── README.txt               ← Este archivo
│
├── ollama/                  ← Ejecutables de Ollama
│   ├── ollama.exe
│   └── lib/ollama/          ← Librerías (CUDA, Vulkan, etc)
│
├── modelos/                 ← Modelos de IA
│   └── models/
│       ├── blobs/           ← Archivos de modelos
│       └── manifests/       ← Información de modelos
│
├── frontend/                ← Aplicación React
│   ├── src/                 ← Código fuente
│   ├── server/              ← Servidor Express
│   ├── package.json
│   └── node_modules/
│
├── FirefoxPortable/         ← Navegador
├── nodejs-portable.exe      ← Node.js
└── work/                    ← Carpeta de trabajo (logs, etc)
```

---

## 🔧 PUERTOS

- **5173** - Frontend (http://localhost:5173)
- **11434** - Ollama API (http://localhost:11434)
- **3001** - Servidor de archivos (http://localhost:3001)

---

## ⚠️ PRIMEROS PASOS

### Primera vez:
1. Ejecuta `iniciar.bat`
2. Espera a que se instalen las dependencias (puede tardar unos minutos)
3. Se abrirá Firefox automáticamente

### Problemas comunes:

**"Puerto 5173 ya está en uso"**
→ Cierra cualquier otra aplicación que use ese puerto, o ejecuta `detener.bat`

**"No hay modelos disponibles"**
→ Verifica que la carpeta `modelos/models` contiene archivos

**"Connection refused"**
→ Espera unos segundos a que Ollama inicie completamente

**"Firefox no abre"**
→ Abre manualmente `http://localhost:5173` en tu navegador

---

## 📝 MODELOS DISPONIBLES

Los modelos que tienes precargados están en `modelos/models/manifests/`:

- Modelos cloud de ollama
- qwen3
- (y más)

Selecciona el que quieras en la interfaz web.

---

## 💾 TAMAÑOS DE ARCHIVOS

Cada modelo ocupa:
- **Pequeño** (~4GB) - qwen2.5
- **Mediano** (~7GB) - neural-chat
- **Grande** (~13GB+) - deepseek-v3, gpt-oss

**Nota:** El primero que uses tardará un poco en cargar. Después serán más rápidos.

---

## 🔒 PRIVACIDAD

✓ Todo funciona LOCAL (sin conexión a internet)  
✓ Tus datos NO se envían a servidores externos  
✓ Puedes desconectar el wifi y seguirá funcionando

---

## 📚 MÁS INFORMACIÓN

- Documentación Ollama: https://ollama.ai
- Frontend: `frontend/README.md`
- Troubleshooting: `frontend/INSTALACION.md`

---

## 🆘 SOPORTE

Si algo no funciona:

1. Cierra todo con `detener.bat`
2. Abre PowerShell en esta carpeta
3. Ejecuta: `npm install` en la carpeta `frontend`
4. Intenta de nuevo con `iniciar.bat`

---

**¡Disfruta de OllaGPT Portable! 🚀**

Creado: 2025-01-27
