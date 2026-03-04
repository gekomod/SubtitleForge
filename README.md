<div align="center">

# ⚡ SubtitleForge

### Cinema-grade AI subtitle translation studio

**[subtitleforge.pl](https://subtitleforge.pl)** · [Report Bug](https://github.com/yourusername/subtitleforge/issues) · [Request Feature](https://github.com/yourusername/subtitleforge/issues)

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Netlify Status](https://api.netlify.com/api/v1/badges/804e4da8-be01-40a3-8fef-4133921ca9ad/deploy-status)](https://app.netlify.com/projects/teal-kangaroo-9931e5/deploys)

</div>

---

## Co to jest?

SubtitleForge to lokalnie hostowana aplikacja webowa do tłumaczenia napisów filmowych przy użyciu AI. Obsługuje **11 silników tłumaczących** — od bezpłatnych lokalnych (Ollama, LibreTranslate, DeepLX) po profesjonalne API chmurowe (DeepL, Azure, Anthropic). Zaprojektowana z myślą o prywatności — tłumaczenie może odbywać się w 100% lokalnie, bez wysyłania danych na zewnętrzne serwery.

---

## Funkcje

### Tłumaczenie
- **Formaty napisów**: SRT, ASS/SSA, VTT — z pełnym zachowaniem tagów formatowania (`{\an8}`, `{\b1}` itp.)
- **Podgląd na żywo**: tłumaczenie pojawia się blok po bloku podczas pracy
- **Porównanie side-by-side**: oryginalny tekst obok tłumaczenia
- **Auto-detekcja języka**: automatyczne rozpoznanie języka źródłowego
- **Batch processing**: regulowany rozmiar paczki (1–10 bloków)
- **ETA kalkulator**: estymowany czas zakończenia z wykresem prędkości

### Silniki tłumaczące

| Silnik | Typ | Klucz API | Opis |
|--------|-----|-----------|------|
| **LibreTranslate** | 🏠 Lokalny | Nie | Open-source, własny serwer |
| **Google GTX** | 🌐 Darmowy | Nie | Nieoficjalne API Google Translate |
| **Ollama** | 🏠 Lokalny | Nie | Lokalne modele LLM (Llama, Mistral, Gemma…) |
| **DeepLX** | 🏠 Lokalny | Nie | Darmowy proxy DeepL |
| **DeepSeek** | ☁️ Chmura | Tak | Zaawansowane modele AI, tanie API |
| **OpenRouter** | ☁️ Chmura | Tak | Dostęp do Llama, GPT-4, Claude i innych |
| **Anthropic Claude** | ☁️ Chmura | Tak | Modele Claude (Haiku, Sonnet, Opus) |
| **Azure Translator** | ☁️ Chmura | Tak | Microsoft Cognitive Services |
| **Google Cloud** | ☁️ Chmura | Tak | Google Cloud Translation API v2 |
| **DeepL Pro** | ☁️ Chmura | Tak | Profesjonalne tłumaczenie DeepL |
| **Custom API** | ⚙️ Własny | Opcjonalnie | Dowolne OpenAI-compatible API |

### Biblioteka i historia
- **Lokalna baza SQLite**: automatyczny zapis każdego tłumaczenia
- **Wyszukiwanie rozmyte**: szukaj po tytule, "Our Universe" znajdzie `Our.Universe.S01E02.1080p...`
- **Historia tłumaczeń**: lista z nazwami plików, silnikiem, datą i przyciskiem pobierania
- **Widok siatki / lista**: dwa tryby wyświetlania historii
- **Sortowanie**: po dacie, nazwie lub liczbie bloków

### UI / UX
- **Tryb ciemny / jasny**: pełne wsparcie, zapamiętywane lokalnie
- **Skróty klawiszowe**: `Spacja` = tłumacz, `?` = lista skrótów, `Ctrl+R` = reset
- **Ostatnio używane silniki**: szybki dostęp do poprzednio używanych
- **Kółko myszy na batch size**: intuitive scroll control
- **Animacja confetti** przy sukcesie 🎉
- **OpenSubtitles**: wyszukiwanie i pobieranie napisów z bazy zewnętrznej (wymaga klucza API)

---

## Wymagania

- **Node.js** 18+ lub 20 LTS
- **npm** / yarn / pnpm

Opcjonalnie (dla silników lokalnych):
- [Ollama](https://ollama.ai/) — `ollama serve` + `ollama pull llama3.2`
- [LibreTranslate](https://libretranslate.com/) — Docker lub pip
- [DeepLX](https://github.com/OwO-Network/DeepLX) — `deeplx` binary

---

## Instalacja

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/yourusername/subtitleforge.git
cd subtitleforge

# 2. Zainstaluj zależności
npm install

# 3. Skopiuj i edytuj plik środowiskowy
cp .env.example .env.local

# 4. Utwórz wymagane katalogi
mkdir -p uploads translated data

# 5. Uruchom serwer deweloperski
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce.

---

## Konfiguracja środowiska (`.env.local`)

```env
# Katalogi robocze
UPLOAD_DIR=./uploads
TRANSLATED_DIR=./translated
DB_PATH=./data/library.db
CACHE_DB_PATH=./data/cache.db

# TTL plików tymczasowych (sekundy)
FILE_TTL=3600
TASK_TTL=7200

# Domyślne adresy silników lokalnych (opcjonalne)
LIBRETRANSLATE_SERVER=http://localhost:5010
OLLAMA_SERVER=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
DEEPLX_SERVER=http://localhost:1188
```

---

## Struktura projektu

```
subtitleforge/
├── app/
│   ├── api/
│   │   ├── translate/        # Endpoint tłumaczenia (SSE)
│   │   ├── upload/           # Upload i parsowanie pliku
│   │   ├── progress/         # Server-Sent Events progress
│   │   ├── preview/          # Podgląd oryginalny i tłumaczenia
│   │   ├── library/          # CRUD biblioteki (SQLite)
│   │   ├── config/           # Konfiguracja silników
│   │   └── test-connection/  # Test połączenia z silnikami
│   ├── download/[filename]/  # Pobieranie przetłumaczonych plików
│   └── globals.css           # Zmienne CSS + tryb jasny/ciemny
├── components/
│   ├── layout/               # Header, Footer, MainTabs
│   ├── tabs/                 # TranslateTab, SearchTab, HistoryTab
│   ├── ui/                   # FileUpload, ProgressBar, PreviewPanel…
│   ├── modals/               # ConfigModal, TestModal
│   └── providers/            # ThemeProvider
├── lib/
│   ├── translators/
│   │   ├── engines.ts        # 11 implementacji silników
│   │   └── worker.ts         # Parser SRT/ASS/VTT + generator
│   ├── db/
│   │   ├── library.ts        # SQLite CRUD + wyszukiwanie
│   │   └── cache.ts          # Cache tłumaczeń
│   └── utils/                # Language detection, helpers
├── uploads/                  # Tymczasowe pliki wejściowe
├── translated/               # Przetłumaczone pliki wyjściowe
└── data/
    └── library.db            # SQLite — biblioteka tłumaczeń
```

---

## Użycie Ollama z modelem tłumaczącym

```bash
# Pobierz ogólny model
ollama pull llama3.2:latest

# Lub specjalistyczny model tłumaczący
ollama pull jnowakk11/translate-polish

# Uruchom serwer (domyślnie port 11434)
ollama serve
```

W konfiguracji silnika Ollama w aplikacji wpisz nazwę modelu, np. `jnowakk11/translate-polish`.
SubtitleForge automatycznie wykrywa modele specjalistyczne (zawierające `translat` w nazwie) i dostosowuje format zapytania — zamiast instrukcji systemowej wysyła czysty tekst do tłumaczenia.

---

## Uruchomienie produkcyjne

```bash
npm run build
npm start
```

Lub z PM2:
```bash
pm2 start npm --name "subtitleforge" -- start
pm2 save
```

---

## Znane ograniczenia

- Pliki tymczasowe (uploads, translated) są czyszczone po czasie określonym w `FILE_TTL` — nie przechowuj oryginalnych plików tylko w katalogu uploads
- Tłumaczenie działa synchronicznie per plik — równoległe zadania nie są wspierane
- Modele Ollama odpowiadają wolniej dla dużych plików (>500 bloków) — zalecany batch size 1

---

## Stack technologiczny

| Kategoria | Technologia |
|-----------|-------------|
| Framework | Next.js 14 (App Router) |
| Język | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| State | Zustand |
| Baza danych | SQLite (better-sqlite3) |
| Streaming | Server-Sent Events (SSE) |
| HTTP | Axios |
| Ikony | Bootstrap Icons |
| Powiadomienia | React Hot Toast |
| Fonty | Syne + JetBrains Mono |

---

<div align="center">

Made with ☕ for subtitle enthusiasts · [subtitleforge.pl](https://subtitleforge.pl)

</div>
