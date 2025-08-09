Claro, aquí tienes una propuesta completa para el archivo `README.md` de tu proyecto, basada en el código y la estructura que has proporcionado.

***

# RAG con SvelteKit - Chatea con tus Documentos

![Project Screenshot](https://via.placeholder.com/800x450.png?text=RAG+SvelteKit+UI)

Aplicación web inteligente para chatear con documentos PDF. Utiliza un pipeline de **Retrieval-Augmented Generation (RAG)** con modelos de lenguaje locales a través de **Ollama**. El frontend está construido con **SvelteKit** y **Tailwind CSS**, ofreciendo una interfaz de usuario moderna, reactiva y eficiente.

## ✨ Características Principales

*   **Interfaz de Chat Interactiva**: Conversa de forma fluida y natural con el contenido de tus documentos.
*   **Carga de Archivos PDF**: Sube tus propios archivos PDF para que sean procesados y consultados.
*   **Selección Dinámica de Modelos**: Configura y cambia en tiempo real los modelos de embedding y de generación de texto desde la interfaz, utilizando los modelos disponibles en tu instancia de Ollama.
*   **Panel de Control**: Un sidebar informativo que muestra el estado de la conexión con el backend y el servicio de Ollama.
*   **Gestión de Sesión**: Inicia nuevas conversaciones y mantén el contexto de tu sesión actual.
*   **Diseño Responsivo**: Experiencia de usuario óptima en dispositivos de escritorio y móviles.
*   **Notificaciones y Estado en Tiempo Real**: Indicadores visuales para la carga de archivos, procesamiento y generación de respuestas.
*   **Construido con Svelte 5 (Runes)**: Aprovecha las últimas características de Svelte para un código más simple y un rendimiento superior.

## 🛠️ Stack Tecnológico

*   **Frontend**:
    *   **Framework**: SvelteKit
    *   **Lenguaje**: TypeScript
    *   **UI**: Svelte 5 (Runes)
    *   **Estilos**: Tailwind CSS
    *   **Herramientas de Desarrollo**: Vite
*   **Backend (Asumido)**:
    *   **Framework**: Python con FastAPI
    *   **Orquestación LLM**: LangChain o LlamaIndex
    *   **Modelos de Lenguaje**: Ollama
    *   **Base de Datos Vectorial**: ChromaDB o FAISS

## 📂 Estructura del Proyecto

El proyecto sigue la estructura estándar de una aplicación SvelteKit, organizada para una máxima escalabilidad y mantenibilidad.

```
/
├── .vscode/                  # Configuraciones de VS Code
├── node_modules/             # Dependencias de Node.js
├── src/                      # Código fuente principal de la aplicación
│   ├── lib/                  # Librerías y módulos compartidos
│   │   ├── components/       # Componentes Svelte reutilizables
│   │   │   ├── ui/           # Componentes de UI genéricos (botones, sidebar, etc.)
│   │   │   │   └── Sidebar.svelte
│   │   │   ├── ChatMessage.svelte
│   │   │   ├── FileUpload.svelte
│   │   │   └── QuerySection.svelte
│   │   ├── services/         # Lógica para comunicarse con APIs externas
│   │   │   └── api.ts
│   │   ├── stores/           # Stores de Svelte para la gestión del estado global
│   │   │   ├── app.ts
│   │   │   └── logger.ts
│   │   └── utils/            # Funciones de utilidad
│   ├── routes/               # Define las rutas de la aplicación
│   │   ├── +layout.svelte    # Layout principal que envuelve todas las páginas
│   │   └── +page.svelte      # Página principal de la aplicación
│   ├── app.css               # Estilos globales (configuración de Tailwind)
│   └── app.d.ts              # Declaraciones de tipos de TypeScript
├── static/                   # Archivos estáticos (imágenes, favicons, etc.)
│   └── favicon.ico
├── .env.example              # Ejemplo de variables de entorno
├── .gitignore                # Archivos ignorados por Git
├── package.json              # Dependencias y scripts del proyecto
├── svelte.config.js          # Configuración de SvelteKit
├── tailwind.config.js        # Configuración de Tailwind CSS
└── tsconfig.json             # Configuración de TypeScript
```

### Explicación de Archivos y Carpetas Clave

*   `src/lib/components/`: Contiene todos los componentes de Svelte.
    *   `QuerySection.svelte`: El componente principal que gestiona el área de chat, la entrada de preguntas y la lógica de envío.
    *   `ui/Sidebar.svelte`: El panel lateral para la configuración de modelos, estado del sistema y acciones como "Nuevo Chat".
    *   `FileUpload.svelte`: Componente para seleccionar y previsualizar el archivo PDF a subir.
*   `src/lib/services/api.ts`: Centraliza toda la comunicación con el backend. Contiene funciones para subir archivos (`uploadPDF`), hacer consultas (`queryDocuments`), y gestionar los modelos de Ollama (`getOllamaModels`, `setActiveModel`).
*   `src/lib/stores/app.ts`: Un store centralizado de Svelte (usando `writable`) que maneja el estado global de la aplicación: mensajes del chat, estado de la conexión, archivo seleccionado, progreso de subida, etc.
*   `src/routes/+layout.svelte`: El layout raíz de la aplicación. Define la estructura visual principal (como la disposición del sidebar y el área de contenido) y contiene la lógica que se aplica a todas las páginas, como el cambio de tema (claro/oscuro).
*   `src/routes/+page.svelte`: La página de inicio que renderiza los componentes principales como `QuerySection` y `Sidebar`.

## 🚀 Instalación y Puesta en Marcha

Para ejecutar este proyecto localmente, necesitarás tener instalado Node.js, npm (o pnpm/yarn) y Ollama.

### 1. Prerrequisitos

*   **Node.js**: Versión 18 o superior.
*   **Ollama**: Asegúrate de que esté instalado y en ejecución. Puedes descargarlo desde [ollama.com](https://ollama.com/).
*   **Modelos de Ollama**: Descarga los modelos que planeas usar. Por ejemplo:
    ```bash
    ollama pull llama3.2:3b-instruct-q6_K
    ollama pull granite-embedding:278m
    ```
*   **Backend**: Clona y ejecuta el servidor backend del RAG (no incluido en este repositorio). Asegúrate de que esté accesible desde el frontend.

### 2. Configuración del Frontend

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/martin-araya/train-rag-kit.git
    cd train-rag-kit
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Variables de Entorno:**
    Crea un archivo `.env` en la raíz del proyecto a partir de `.env.example` y configura la URL de tu API de backend.
    ```env
    # .env
    PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
    ```

4.  **Ejecutar la aplicación en modo de desarrollo:**
    ```bash
    npm run dev
    ```

5.  Abre tu navegador y visita `http://localhost:5173`.

### 3. Scripts Disponibles

*   `npm run dev`: Inicia el servidor de desarrollo.
*   `npm run build`: Compila la aplicación para producción.
*   `npm run preview`: Sirve la aplicación compilada localmente.
*   `npm run check`: Ejecuta el validador de Svelte para comprobar el código.

## 📄 Uso

1.  **Verifica el Estado**: Asegúrate de que los indicadores "API Conectada" y "Ollama Activo" en el sidebar estén en verde.
2.  **Selecciona un Archivo**: Haz clic en el área de carga o arrastra un archivo PDF para seleccionarlo.
3.  **Haz una Pregunta**: Escribe tu pregunta sobre el documento en el área de texto.
4.  **Envía la Consulta**: Presiona `Enter` o haz clic en el botón de enviar.
    *   Si adjuntaste un nuevo archivo, este se subirá y procesará primero.
    *   Luego, tu pregunta será enviada al backend para generar una respuesta utilizando el pipeline RAG.
5.  **Configura Modelos**: Usa el botón "Configurar Modelos" en el sidebar para cambiar los modelos de embedding o de generación que utiliza el sistema.
