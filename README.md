# SubtitleForge • AI Translation

![SubtitleForge](public/og-image.png)

Cinema-grade AI subtitle translation application with support for 11 AI engines, real-time preview, and local subtitle library.

## 🚀 Features

### Core Functionality
- **Multi-format Support**: SRT, ASS/SSA, VTT subtitle formats
- **11 AI Translation Engines**:
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

### User Experience
- **Drag & Drop Upload**: Simple file upload with preview
- **Real-time Translation Progress**: Live progress bar with block-by-block updates
- **Live Preview**: See translations appear in real-time as they're processed
- **Dual View**: Side-by-side comparison of original and translated subtitles
- **Auto Language Detection**: Automatic source language detection
- **Dark/Light Theme**: Full theme support with persistent preference

### Library Management
- **Local Subtitle Library**: Automatically save all translations
- **Search & Filter**: Find translations by title or language
- **Recent Translations**: Quick access to recently translated files
- **One-click Download**: Direct download of translated files
- **Delete Management**: Remove entries from library

### Advanced Features
- **OpenSubtitles Integration**: Search and download subtitles from OpenSubtitles.com
- **Engine Configuration**: Configure API keys, servers, and models for each engine
- **Connection Testing**: Test engine connectivity before use
- **Smart Time Estimates**: Realistic translation time estimates based on engine speed
- **Format Preservation**: Maintains ASS styling tags ({\an8}) during translation

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: SQLite (via sql.js)
- **Icons**: Bootstrap Icons
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 18+ or 20+ (LTS recommended)
- npm or yarn or pnpm
- For local engines: Docker or native installations
  - [LibreTranslate](https://libretranslate.com/)
  - [Ollama](https://ollama.ai/)
  - [DeepLX](https://github.com/OwO-Network/DeepLX)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/subtitleforge-nextjs.git
cd subtitleforge-nextjs