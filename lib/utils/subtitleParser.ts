export interface SubtitleBlock {
  id: number
  start: string
  end: string
  text: string
}

export function parseSRT(content: string): SubtitleBlock[] {
  const blocks: SubtitleBlock[] = []
  const lines = content.split('\n')
  let currentBlock: Partial<SubtitleBlock> = {}
  let blockText: string[] = []
  let inBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line && inBlock) {
      // End of block
      if (currentBlock.id && currentBlock.start && blockText.length) {
        blocks.push({
          id: currentBlock.id,
          start: currentBlock.start || '',
          end: currentBlock.end || '',
          text: blockText.join('\n').trim(),
        })
      }
      currentBlock = {}
      blockText = []
      inBlock = false
      continue
    }
    
    if (!line) continue
    
    if (!inBlock) {
      // New block - first line should be a number
      const num = parseInt(line, 10)
      if (!isNaN(num)) {
        currentBlock.id = num
        inBlock = true
      }
      continue
    }
    
    // Check for timestamp line
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(s => s.trim())
      currentBlock.start = start
      currentBlock.end = end
      continue
    }
    
    // Text line
    blockText.push(line)
  }
  
  // Add last block if exists
  if (inBlock && currentBlock.id && currentBlock.start && blockText.length) {
    blocks.push({
      id: currentBlock.id,
      start: currentBlock.start || '',
      end: currentBlock.end || '',
      text: blockText.join('\n').trim(),
    })
  }
  
  return blocks
}

export function parseASS(content: string): SubtitleBlock[] {
  const blocks: SubtitleBlock[] = []
  const lines = content.split('\n')
  let eventSection = false
  
  for (const line of lines) {
    if (line.startsWith('[Events]')) {
      eventSection = true
      continue
    }
    
    if (eventSection && line.startsWith('Dialogue:')) {
      const parts = line.split(',', 10)
      if (parts.length >= 10) {
        const start = parts[1].trim()
        const end = parts[2].trim()
        const text = parts.slice(9).join(',').trim()
          .replace(/\{[^}]*\}/g, '') // Remove ASS styling
          .replace(/\\N/g, '\n') // Convert line breaks
        
        blocks.push({
          id: blocks.length + 1,
          start,
          end,
          text,
        })
      }
    }
  }
  
  return blocks
}

export function parseVTT(content: string): SubtitleBlock[] {
  const blocks: SubtitleBlock[] = []
  const lines = content.split('\n')
  let i = 0
  
  // Skip WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++
  }
  
  let blockId = 1
  
  while (i < lines.length) {
    const line = lines[i].trim()
    
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(s => s.trim())
      i++
      
      // Collect text lines
      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim())
        i++
      }
      
      blocks.push({
        id: blockId++,
        start,
        end,
        text: textLines.join('\n'),
      })
    }
    
    i++
  }
  
  return blocks
}

export function extractTextFromASS(content: string): string {
  const lines = content.split('\n')
  let eventSection = false
  const texts: string[] = []
  
  for (const line of lines) {
    if (line.startsWith('[Events]')) {
      eventSection = true
      continue
    }
    
    if (eventSection && line.startsWith('Dialogue:')) {
      const parts = line.split(',', 10)
      if (parts.length >= 10) {
        const text = parts.slice(9).join(',').trim()
          .replace(/\{[^}]*\}/g, '')
          .replace(/\\N/g, ' ')
        if (text) {
          texts.push(text)
        }
      }
    }
  }
  
  return texts.join(' ')
}

export function countBlocks(content: string, format: string): number {
  if (format === 'ass') {
    return (content.match(/Dialogue:/g) || []).length
  }
  if (format === 'vtt') {
    return (content.match(/-->/g) || []).length
  }
  // SRT
  return (content.match(/\d+\n\d{2}:\d{2}:\d{2}/g) || []).length
}