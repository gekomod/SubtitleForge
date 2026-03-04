/**
 * Encoding detection & conversion for subtitle files
 * Handles UTF-8, UTF-16, Windows-1250, ISO-8859-2 without external deps
 */

// Windows-1250 → Unicode mapping for Polish characters
const WIN1250_MAP: Record<number, number> = {
  0x8A: 0x0160, 0x8C: 0x015A, 0x8D: 0x0164, 0x8E: 0x017D, 0x8F: 0x0179,
  0x9A: 0x0161, 0x9C: 0x015B, 0x9D: 0x0165, 0x9E: 0x017E, 0x9F: 0x017A,
  0xA5: 0x0104, 0xB9: 0x0105, 0xC6: 0x0106, 0xE6: 0x0107,
  0xD1: 0x0143, 0xF1: 0x0144, 0xD3: 0x00D3, 0xF3: 0x00F3,
  0x8B: 0x2039, 0x9B: 0x203A,
  0xC3: 0x00C3, 0xE3: 0x00E3,
  // Extended Latin chars common in Polish
  0x9C: 0x015B, // ś
  0x9F: 0x017A, // ź
  0xA3: 0x0141, // Ł
  0xB3: 0x0142, // ł
  0xBC: 0x017C, // ż  
  0xAF: 0x017B, // Ż
}

// ISO-8859-2 → Unicode mapping for Polish characters
const ISO88592_MAP: Record<number, number> = {
  0xA1: 0x0104, 0xA3: 0x0141, 0xA6: 0x015A, 0xA9: 0x0160,
  0xAB: 0x0164, 0xAE: 0x017D, 0xB1: 0x0105, 0xB3: 0x0142,
  0xB6: 0x015B, 0xB9: 0x0161, 0xBB: 0x0165, 0xBE: 0x017E,
  0xC3: 0x0102, 0xC5: 0x0139, 0xC6: 0x0106, 0xCA: 0x0118,
  0xCC: 0x011A, 0xCF: 0x010E, 0xD0: 0x0110, 0xD1: 0x0143,
  0xD2: 0x0147, 0xD5: 0x0150, 0xD8: 0x0158, 0xD9: 0x016E,
  0xDB: 0x0170, 0xDE: 0x0162,
  0xE3: 0x0103, 0xE5: 0x013A, 0xE6: 0x0107, 0xEA: 0x0119,
  0xEC: 0x011B, 0xEF: 0x010F, 0xF0: 0x0111, 0xF1: 0x0144,
  0xF2: 0x0148, 0xF5: 0x0151, 0xF8: 0x0159, 0xF9: 0x016F,
  0xFB: 0x0171, 0xFE: 0x0163,
  // Direct Polish letters
  0xD3: 0x00D3, 0xF3: 0x00F3, // Ó ó
  0xBF: 0x017C, // ż
  0xAF: 0x017B, // Ż
}

function decodeWithMap(buf: Buffer, map: Record<number, number>): string {
  let result = ''
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i]
    if (b < 0x80) {
      result += String.fromCharCode(b)
    } else if (map[b]) {
      result += String.fromCharCode(map[b])
    } else if (b >= 0xA0 && b <= 0xFF) {
      // Latin-1 supplement fallback
      result += String.fromCharCode(b)
    } else {
      result += '?'
    }
  }
  return result
}

export type DetectedEncoding = 'utf-8' | 'utf-16le' | 'utf-16be' | 'windows-1250' | 'iso-8859-2'

export function detectEncoding(buf: Buffer): DetectedEncoding {
  // BOM check
  if (buf[0] === 0xFF && buf[1] === 0xFE) return 'utf-16le'
  if (buf[0] === 0xFE && buf[1] === 0xFF) return 'utf-16be'
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) return 'utf-8'

  // Try UTF-8 validation
  let isValidUtf8 = true
  let i = 0
  while (i < Math.min(buf.length, 4096)) {
    const b = buf[i]
    if (b < 0x80) { i++; continue }
    const seqLen = b < 0xE0 ? 2 : b < 0xF0 ? 3 : 4
    if (i + seqLen > buf.length) { isValidUtf8 = false; break }
    for (let j = 1; j < seqLen; j++) {
      if ((buf[i + j] & 0xC0) !== 0x80) { isValidUtf8 = false; break }
    }
    if (!isValidUtf8) break
    i += seqLen
  }
  if (isValidUtf8) return 'utf-8'

  // Heuristic: count Windows-1250 vs ISO-8859-2 Polish char patterns
  // Windows-1250 Polish chars in 0x80–0x9F range: ś(0x9C) ź(0x9F) ż(0xBC) ł(0xB3)
  // ISO-8859-2 Polish chars in 0xB0–0xFF range: ą(0xB1) ę(0xEA) ó(0xF3) ź(0x9F not present)
  let win1250Score = 0
  let iso88592Score = 0
  
  for (let i = 0; i < Math.min(buf.length, 8192); i++) {
    const b = buf[i]
    // Win-1250 specific: 0x80–0x9F range has Polish letters
    if (b >= 0x80 && b <= 0x9F && WIN1250_MAP[b]) win1250Score++
    // ISO-8859-2 specific patterns
    if ((b === 0xB1 || b === 0xB3 || b === 0xA1 || b === 0xA3) && ISO88592_MAP[b]) iso88592Score++
    // Bytes in 0xBC–0xBF are more likely Win-1250 for Polish
    if (b >= 0xBC && b <= 0xBF) win1250Score += 0.5
  }

  return win1250Score >= iso88592Score ? 'windows-1250' : 'iso-8859-2'
}

export function decodeBuffer(buf: Buffer, enc?: DetectedEncoding): string {
  const detected = enc || detectEncoding(buf)
  
  switch (detected) {
    case 'utf-16le':
      return buf.slice(buf[0] === 0xFF ? 2 : 0).toString('utf16le')
    case 'utf-16be': {
      // Swap bytes
      const swapped = Buffer.allocUnsafe(buf.length - 2)
      for (let i = 2; i < buf.length; i += 2) {
        swapped[i - 2] = buf[i + 1]
        swapped[i - 1] = buf[i]
      }
      return swapped.toString('utf16le')
    }
    case 'utf-8':
      return buf.slice(buf[0] === 0xEF ? 3 : 0).toString('utf-8')
    case 'windows-1250':
      return decodeWithMap(buf, WIN1250_MAP)
    case 'iso-8859-2':
      return decodeWithMap(buf, ISO88592_MAP)
    default:
      return buf.toString('utf-8')
  }
}

export function readSubtitleFile(buf: Buffer): { content: string; encoding: DetectedEncoding } {
  const encoding = detectEncoding(buf)
  const content = decodeBuffer(buf, encoding)
  return { content, encoding }
}
