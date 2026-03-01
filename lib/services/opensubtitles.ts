import axios from 'axios'

const OPENSUBTITLES_API = 'https://api.opensubtitles.com/api/v1'

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
  year?: string
  feature_type?: string
  error?: string
}

// Funkcja do określenia czy to serial na podstawie zapytania
function isTVShow(query: string): boolean {
  const tvShowPatterns = [
    /S\d{1,2}E\d{1,2}/i,  // S01E05, S1E5
    /Season \d+/i,          // Season 1
    /Episode \d+/i,         // Episode 5
    /\d+x\d+/i,             // 1x05
  ]
  return tvShowPatterns.some(pattern => pattern.test(query))
}

// Funkcja do ekstrakcji season/episode z zapytania
function extractSeasonEpisode(query: string): { season?: number; episode?: number } {
  const seasonEpisodeMatch = query.match(/S(\d{1,2})E(\d{1,2})/i) || 
                            query.match(/(\d{1,2})x(\d{1,2})/i) ||
                            query.match(/season (\d+).*episode (\d+)/i)
  
  if (seasonEpisodeMatch) {
    return {
      season: parseInt(seasonEpisodeMatch[1], 10),
      episode: parseInt(seasonEpisodeMatch[2], 10)
    }
  }
  return {}
}

// Funkcja do normalizacji tytułu (usuwanie polskich znaków, lower case)
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (match) => {
      const map: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
        'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z'
      }
      return map[match]
    })
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function searchOpenSubtitles(
  query: string,
  targetLang: string = 'pl',
  apiKey: string
): Promise<OpenSubtitlesResult[] | { error: string }> {
  if (!apiKey) {
    return { error: 'Brak klucza API OpenSubtitles. Dodaj klucz w zakładce OpenSubtitles.' }
  }

  if (query.length < 3) {
    return { error: 'Zapytanie musi mieć co najmniej 3 znaki' }
  }

  try {
    console.log('Searching OpenSubtitles:', { query, targetLang })

    // Normalizuj zapytanie
    const normalizedQuery = normalizeTitle(query)
    console.log('Normalized query:', normalizedQuery)

    // Przygotuj bazowe parametry
    const baseParams: any = {
      languages: targetLang,
      order_by: 'download_count',
      order_direction: 'desc',
      limit: 50, // Zwiększamy limit
    }

    // Próba 1: Wyszukiwanie z query
    console.log('Attempt 1: Search with query')
    const response1 = await axios.get(`${OPENSUBTITLES_API}/subtitles`, {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'SubtitleForge v1.0',
        'Accept': 'application/json'
      },
      params: {
        ...baseParams,
        query: normalizedQuery,
      },
      timeout: 15000,
    })

    let allResults: any[] = []
    
    if (response1.data?.data) {
      console.log(`Found ${response1.data.data.length} results with query`)
      allResults = [...response1.data.data]
    }

    // Próba 2: Wyszukiwanie bez query (tylko język) - dla nowych tytułów
    if (allResults.length === 0) {
      console.log('Attempt 2: Search by language only (for new titles)')
      
      // Podziel zapytanie na słowa kluczowe
      const keywords = normalizedQuery.split(' ').filter(word => word.length > 3)
      
      for (const keyword of keywords.slice(0, 3)) { // Maksymalnie 3 słowa kluczowe
        try {
          const response2 = await axios.get(`${OPENSUBTITLES_API}/subtitles`, {
            headers: {
              'Api-Key': apiKey,
              'Content-Type': 'application/json',
              'User-Agent': 'SubtitleForge v1.0',
              'Accept': 'application/json'
            },
            params: {
              languages: targetLang,
              query: keyword,
              order_by: 'download_count',
              limit: 20,
            },
            timeout: 10000,
          })
          
          if (response2.data?.data) {
            console.log(`Found ${response2.data.data.length} results for keyword: ${keyword}`)
            allResults = [...allResults, ...response2.data.data]
          }
        } catch (e) {
          console.log(`Error searching for keyword ${keyword}:`, e)
        }
      }
    }

    // Próba 3: Wyszukiwanie po tytule (bez języka)
    if (allResults.length === 0) {
      console.log('Attempt 3: Search by title only (any language)')
      try {
        const response3 = await axios.get(`${OPENSUBTITLES_API}/subtitles`, {
          headers: {
            'Api-Key': apiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'SubtitleForge v1.0',
            'Accept': 'application/json'
          },
          params: {
            query: normalizedQuery,
            order_by: 'download_count',
            limit: 30,
          },
          timeout: 15000,
        })
        
        if (response3.data?.data) {
          console.log(`Found ${response3.data.data.length} results in any language`)
          // Filtruj tylko polskie jeśli targetLang = 'pl'
          if (targetLang === 'pl') {
            const polishResults = response3.data.data.filter((item: any) => 
              item.attributes?.language === 'pl'
            )
            allResults = [...allResults, ...polishResults]
          } else {
            allResults = [...allResults, ...response3.data.data]
          }
        }
      } catch (e) {
        console.log('Error searching by title only:', e)
      }
    }

    // Usuń duplikaty po file_id
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.attributes?.files?.[0]?.file_id, item])).values()
    )

    console.log(`Total unique results: ${uniqueResults.length}`)

    if (uniqueResults.length > 0) {
      return uniqueResults.map((item: any) => ({
        id: item.id,
        file_id: item.attributes?.files?.[0]?.file_id,
        title: item.attributes?.feature_details?.title || 
               item.attributes?.title || 
               query,
        movie_name: item.attributes?.feature_details?.movie_name,
        season: item.attributes?.feature_details?.season_number,
        episode: item.attributes?.feature_details?.episode_number,
        lang: item.attributes?.language,
        downloads: item.attributes?.download_count || 0,
        uploader: item.attributes?.uploader?.name,
        file_name: item.attributes?.files?.[0]?.file_name,
        year: item.attributes?.feature_details?.year,
        feature_type: item.attributes?.feature_details?.feature_type,
      }))
    }

    return []
  } catch (error: any) {
    console.error('OpenSubtitles search error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })

    if (error.response?.status === 400) {
      return { error: 'Błąd zapytania - spróbuj bardziej szczegółowej nazwy (np. z tytułem filmu)' }
    }

    if (error.response?.status === 401) {
      return { error: 'Nieprawidłowy klucz API. Sprawdź klucz na https://www.opensubtitles.com/consumers' }
    }

    if (error.response?.status === 429) {
      return { error: 'Limit zapytań do OpenSubtitles został przekroczony. Odczekaj chwilę i spróbuj ponownie.' }
    }

    return { error: 'Błąd połączenia z OpenSubtitles. Sprawdź połączenie internetowe.' }
  }
}

export async function getDownloadLink(fileId: number, apiKey: string): Promise<string | null> {
  if (!apiKey) return null

  try {
    const response = await axios.post(
      `${OPENSUBTITLES_API}/download`,
      { 
        file_id: fileId,
        sub_format: 'srt'
      },
      {
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'SubtitleForge v1.0',
          'Accept': 'application/json'
        },
        timeout: 10000,
      }
    )

    return response.data?.link || null
  } catch (error: any) {
    console.error('Error getting download link:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    return null
  }
}