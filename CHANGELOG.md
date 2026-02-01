# Changelog – StudioOllamaUI

## [v1.3.1] – 2026-02-01
### ES | Mejoras y Optimizaciones
* **Traducciones mejoradas:** Actualizaciones menores en las traducciones al ingles.
---
### EN | Improvements & Optimizations
* **Enhanced translations:** Minor fixes in translations.


## [v1.3] – 2026-02-01
### ES | Mejoras y Optimizaciones
* **Terminal de depuración integrada:** Ahora se puede activar una terminal para mostrar mensajes de depuración, equivalente al modo `--verbose` cuando se utiliza la CLI.
* **Prompt interno optimizado:** Se ha mejorado la estructura de los prompts para reducir el ruido y las alucinaciones en modelos como DeepSeek.
* **Historial con mecanismo de acordeón:** La zona de historial ahora cuenta con un diseño colapsable mediante un chevron, optimizando el espacio en la barra lateral.
* **Contraste de UI mejorado:** Se han ajustado los niveles de contraste entre las distintas áreas de la interfaz para una mejor legibilidad.
* **Corrección en importación de archivos:** Se ha reparado el selector de archivos, permitiendo ahora la importación de cualquier documento sin errores.
* **Importador de modelos avanzado:** El sistema ahora muestra el progreso real de la descarga al añadir nuevos modelos.
* **Control de memoria y contexto:** Se ha añadido una función para limpiar el contexto manteniendo la conversación visible. Esto evita referencias a temas pasados y ahorra tokens en modelos cloud. El límite por defecto se ha ajustado a los últimos 6 mensajes (antes 12).
* **Restricciones de comandos de seguridad:** Por seguridad, el modelo solo puede gestionar archivos y directorios dentro de su sandbox. Cualquier comando de sistema será mostrado en pantalla para que el usuario lo ejecute manualmente en la terminal.
* **Nuevo modelo por defecto:** Para reducir el tamano de la aplicacion el modelo por defecto ha pasado a ser qwen2.5:0.5b.
* **Agregado botón para resetear cookies en la barra de herramientas:** Elimina las cookies reseteando el contador de tokens y las claves API introducidas.
---
### EN | Improvements & Optimizations
* **Integrated Debug Terminal:** A terminal can now be enabled to display debug messages, equivalent to `--verbose` mode in CLI environments.
* **Enhanced Internal Prompting:** Improved prompt engineering for models like DeepSeek to minimize noise and hallucinations.
* **Accordion-style Chat History:** The history sidebar now features a collapsible accordion with a chevron icon to maximize workspace.
* **UI Contrast Enhancements:** Improved visual contrast across different UI zones for better accessibility and clarity.
* **File Import Fix:** Resolved issues with the file selector; users can now seamlessly import any supported file.
* **Upgraded Model Importer:** The interface now displays a progress bar when downloading and installing new models.
* **Memory & Context Management:** Added a tool to clear active context while keeping the chat history visible. This prevents context drift and optimizes token usage in cloud models. Default memory is now set to 6 messages (formerly 12).
* **Command Execution Constraints:** For security, the model is restricted to file and directory operations within its sandbox. System-level commands will be displayed as code blocks for manual execution by the user.
* **New default model:** For reduce the application size the new default model is qwen2.5:0.5b.
* **Added button to reset cookies in the toolbar:** Deletes cookies, resetting the token counter and any entered API keys.


## [v1.2] – 2026-01-31
## ES Español | Mejoras y Optimizaciones:
- **Contador de tokens mejorado:** Ahora muestra tokens de entrada, salida y el total de forma clara y precisa.
- **Rediseño del fondo de la interfaz:** Se incorpora el logo, una paleta de colores más coherente y mayor contraste entre botones y secciones.
- **Área de chat mejorada:** Se añade una animación visual cuando el modelo está procesando una respuesta.
- **Scroll del sidebar optimizado:** Ya no quedan áreas ocultas al expandir el panel lateral.
- **Traducciones refinadas:** Textos más precisos, naturales y consistentes en toda la aplicación.
- **Sistema de ayuda ampliado:** Más explicaciones y documentación disponible en Español e Inglés.
- **Carpeta de trabajo reforzada:**
  - El modelo ya no escribe fuera de la carpeta de trabajo.
  - Se ha añadido un acceso directo para abrirla fácilmente.
- **Historial de chats mejorado:**
  - Puede plegarse mediante un sistema de acordeón.
  - Incluye barra de desplazamiento para no ocultar botones.
- **Correcciones generales:** Solucionadas decenas de pequeños errores.

### US English | Improvements and Optimizations:
- **Enhanced token counter:** Displays input, output, and total tokens clearly.
- **UI background redesign:** Added logo, cohesive color palette, and improved contrast.
- **Chat area improvements:** Visual animation shown while the model is thinking.
- **Optimized sidebar scrolling:** No hidden areas when expanding the sidebar.
- **Improved translations:** More accurate and natural wording throughout the app.
- **Expanded help system:** More explanations, fully bilingual.
- **Work directory improvements:**
  - The model no longer writes outside its working directory.
  - Added a direct shortcut for quick access.
- **Chat history enhancements:**
  - Collapsible accordion-style panel.
  - Independent scrollbar to avoid hiding UI elements.
- **General fixes:** Dozens of minor bugs resolved.



## [v1.1] – 2026-01-30

### 🇪🇸 Español | Mejoras y Nuevas Funcionalidades:
- **Selector de idioma:** Interfaz en Español e Inglés.
- **Seguridad reforzada (Sandbox):** Ejecución aislada dentro de su propia carpeta.
- **Gestión de archivos:** Importación de archivos al sandbox, sin acceso a archivos personales.
- **Búsqueda web:** Algoritmo optimizado.
- **Documentación:** Ayuda actualizada y bilingüe.

**Correcciones y Optimización:**
- **Privacidad:** Eliminada la selección directa de carpetas locales.
- **Rendimiento:** Menor tamaño de descarga y respuestas más limpias.
- **Errores:** Correcciones en el contador de tokens y UI.

### 🇺🇸 English | Improvements & New Features:
- **Language selector:** Switch between Spanish and English.
- **Enhanced security (Sandbox):** Fully isolated execution environment.
- **File management:** Import-only access inside the sandbox.
- **Web search:** Optimized search algorithm.
- **Documentation:** Updated bilingual help system.

**Fixes & Optimization:**
- **Privacy:** Removed direct local folder selection.
- **Performance:** Reduced download size and cleaner responses.
- **Bug fixes:** Token counter and minor UI improvements.
