# SubtitleForge • AI Translation

Cinema-grade AI subtitle translation with support for 11 AI engines, real-time preview, and local subtitle library.

## ✨ Features

### 🎯 Core Functionality
- **Multi-format Support**: SRT, ASS/SSA, VTT subtitle formats
- **11 AI Translation Engines**: From local to cloud-based solutions
  - LibreTranslate (local, open-source)
  - Google GTX (free)
  - Ollama (local AI models)
  - DeepLX (free DeepL proxy)
  - DeepSeek API
  - OpenRouter (Llama, GPT, Claude)
  - Anthropic Claude
  - Azure Translator
  - Google Cloud Translation
  - DeepL Pro
  - Custom API support
- **Format Preservation**: Maintains ASS styling tags (`{\an8}`) during translation

### 🚀 User Experience
- **Drag & Drop Upload**: Simple file upload with instant preview
- **Real-time Progress**: Live progress bar with block-by-block updates
- **Live Preview**: See translations appear in real-time as they're processed
- **Side-by-Side View**: Compare original and translated subtitles
- **Auto Language Detection**: Automatic source language identification
- **Dark/Light Theme**: Full theme support with persistent preference

### 📚 Library Management
- **Local Subtitle Library**: Automatically save all translations
- **Search & Filter**: Find translations by title or language
- **Recent Translations**: Quick access to recently translated files
- **One-click Download**: Direct download of translated files
- **Delete Management**: Remove entries from library

### 🔧 Advanced Features
- **OpenSubtitles Integration**: Search and download subtitles from OpenSubtitles.com
- **Engine Configuration**: Configure API keys, servers, and models for each engine
- **Connection Testing**: Test engine connectivity before use
- **Smart Time Estimates**: Realistic translation time estimates based on engine speed

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **Database** | SQLite (via sql.js) |
| **Icons** | Bootstrap Icons |
| **HTTP Client** | Axios |
| **Notifications** | React Hot Toast |
| **Date Handling** | date-fns |

---

## 📋 Prerequisites

- Node.js 18+ or 20+ (LTS recommended)
- npm or yarn or pnpm
- For local engines (optional):
  - [LibreTranslate](https://libretranslate.com/)
  - [Ollama](https://ollama.ai/)
  - [DeepLX](https://github.com/OwO-Network/DeepLX)

---

## 🔧 Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/subtitleforge-nextjs.git
cd subtitleforge-nextjs

# 2. Install dependencies
npm install
# or
yarn install
# or
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
```

## Edit .env.local with your configuration:

```bash
# Server
PORT=3000
NODE_ENV=development

# Security
SECRET_KEY=your-secret-key-change-in-production

# Folders
UPLOAD_DIR=./uploads
TRANSLATED_DIR=./translated
DB_PATH=./data/library.db
CACHE_DB_PATH=./data/cache.db

# TTL settings
FILE_TTL=3600
TASK_TTL=7200

# Default engine configs (optional)
LIBRETRANSLATE_SERVER=http://localhost:5010
OLLAMA_SERVER=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
DEEPLX_SERVER=http://localhost:1188
```

## 4. Create required directories
```bash
mkdir -p uploads translated data
```

## 5. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## 6. Open your browser
Navigate to http://localhost:3000

## 🔌 Translation Engines

# Local Engines (No API Key Required)

| Engine          | Description                      | Default URL
| --------------- | -------------------------------- | ---------------------- |
| LibreTranslate  | Open-source, self-hosted         | http://localhost:5010  |
| Google GTX      | Free Google Translate API        | -                      |
| Ollama          | Local AI models (Llama, Mistral) | http://localhost:11434 |
| DeepLX          | Free DeepL proxy                  | http://localhost:1188 |

# Cloud Engines (API Key Required)

| Engine          | Description                      | API Key URL
| --------------- | -------------------------------- | ------------------------------------ |
| DeepSeek        | Advanced AI models               | https://platform.deepseek.com        |
| OpenRouter      | Access to Llama, GPT, Claude     | https://openrouter.ai/keys           |
| Anthropic Claude| Claude AI models                 | https://console.anthropic.com        |
| Azure Translator| Microsoft cloud                  | https://portal.azure.com             |
| Google Cloud    | Google Cloud Translation         | https://console.cloud.google.com     |
| DeepL Pro       | Premium translation              | https://www.deepl.com/pro            |
| Custom API      | Bring your own API               | -                                    |
