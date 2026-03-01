export interface SubtitleBlock {
  id: number
  start: string
  end: string
  text: string
}

export interface UploadedFile {
  id: string
  originalName: string
  filename: string
  path: string
  size: number
  format: string
}

export interface LibraryEntry {
  id: number
  uuid: string
  orig_filename: string
  norm_title: string
  file_path: string
  engine: string
  source_lang: string
  target_lang: string
  blocks: number
  created_at: number
}

export interface TranslationProgress {
  progress: number
  status: 'pending' | 'translating' | 'completed' | 'error'
  output_file?: string
  file_type: string
  created_at: number
  total?: number
  current?: number
  error?: string
}

export interface EngineConfig {
  name: string
  icon: string
  description: string
  enabled: boolean
  server?: string
  api_key?: string
  model?: string
  token?: string
  auth_key?: string
  type?: 'free' | 'pro'
  endpoint?: string
  region?: string
  api_url?: string
}

export interface TranslationRequest {
  source_lang: string
  target_lang: string
  engine: string
  [key: string]: any
}

export interface OpenSubtitlesResult {
  id: string
  file_id: number
  title: string
  movie_name?: string
  season?: number
  episode?: number
  lang: string
  downloads: number
  uploader?: string
  file_name?: string
}

export interface HistoryItem {
  filename: string
  engine: string
  sourceLang: string
  targetLang: string
  blocks: number
  date: string
  downloadUrl?: string
}