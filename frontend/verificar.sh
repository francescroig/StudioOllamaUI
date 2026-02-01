#!/bin/bash
# Script para verificar la instalación de OllaGPT

echo "=========================================="
echo "  StudioOllamaUI - Verificador de Instalación"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
errors=0

# Verificar Node.js
echo -n "✓ Verificando Node.js... "
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo -e "${GREEN}OK${NC} ($node_version)"
else
    echo -e "${RED}NO INSTALADO${NC}"
    ((errors++))
fi

# Verificar npm
echo -n "✓ Verificando npm... "
if command -v npm &> /dev/null; then
    npm_version=$(npm --version)
    echo -e "${GREEN}OK${NC} ($npm_version)"
else
    echo -e "${RED}NO INSTALADO${NC}"
    ((errors++))
fi

# Verificar Ollama
echo -n "✓ Verificando Ollama... "
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}NO INSTALADO${NC} (pero puede continuar)"
fi

# Verificar si está ejecutándose Ollama
echo -n "✓ Verificando si Ollama está ejecutándose... "
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}NO EN EJECUCIÓN${NC} (inicie con: ollama serve)"
fi

# Verificar node_modules
echo -n "✓ Verificando dependencias (node_modules)... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${YELLOW}NO INSTALADAS${NC} (ejecute: npm install)"
fi

# Verificar TypeScript
echo -n "✓ Verificando TypeScript... "
if command -v tsc &> /dev/null; then
    tsc_version=$(tsc --version)
    echo -e "${GREEN}OK${NC} ($tsc_version)"
else
    echo -e "${YELLOW}NO INSTALADO${NC}"
fi

# Verificar que los archivos clave existen
echo ""
echo "Verificando archivos principales..."

archivos=(
    "src/components/App.tsx"
    "src/store.ts"
    "src/api/ollamaService.ts"
    "package.json"
    "vite.config.ts"
    "index.html"
    "server/index.ts"
)

for archivo in "${archivos[@]}"; do
    echo -n "  ✓ $archivo... "
    if [ -f "$archivo" ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}NO EXISTE${NC}"
        ((errors++))
    fi
done

echo ""
echo "=========================================="

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ Todas las verificaciones pasaron${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Ejecutar Ollama: ollama serve"
    echo "2. Iniciar la aplicación: npm run dev"
    echo "3. Abrir navegador: http://localhost:5173"
else
    echo -e "${RED}✗ Se encontraron $errors problema(s)${NC}"
    echo ""
    echo "Por favor, instale los componentes faltantes:"
    echo "- Node.js: https://nodejs.org/"
    echo "- Ollama: https://ollama.ai"
    echo "- Dependencias: npm install"
fi

echo "=========================================="
