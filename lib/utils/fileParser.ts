import * as XLSX from 'xlsx'

export interface ParsedData {
  headers: string[]
  rows: Record<string, any>[]
  totalRows: number
  fileName: string
}

export async function parseExcel(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer)
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
  
  if (data.length === 0) {
    throw new Error('ファイルにデータがありません')
  }

  // Extract headers (first row)
  const headers = data[0].map(h => String(h || '').trim()).filter(h => h)
  
  if (headers.length === 0) {
    throw new Error('ヘッダー行が見つかりません')
  }

  // Convert rows to objects
  const rows = data.slice(1)
    .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
    .map(row => {
      const obj: Record<string, any> = {}
      headers.forEach((header, index) => {
        const value = row[index]
        obj[header] = value !== null && value !== undefined ? String(value).trim() : ''
      })
      return obj
    })
    .filter(row => Object.values(row).some(v => v !== ''))

  return {
    headers,
    rows,
    totalRows: rows.length,
    fileName: file.name,
  }
}

export async function parseCSV(file: File): Promise<ParsedData> {
  const text = await file.text()
  const lines = text.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    throw new Error('ファイルにデータがありません')
  }

  // Parse CSV (simple implementation, handles basic cases)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    
    return result
  }

  const headers = parseCSVLine(lines[0]).filter(h => h)
  
  if (headers.length === 0) {
    throw new Error('ヘッダー行が見つかりません')
  }

  const rows = lines.slice(1)
    .map(line => {
      const values = parseCSVLine(line)
      const obj: Record<string, any> = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      return obj
    })
    .filter(row => Object.values(row).some(v => v !== ''))

  return {
    headers,
    rows,
    totalRows: rows.length,
    fileName: file.name,
  }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv',
    'application/csv',
  ]

  if (file.size > maxSize) {
    return { valid: false, error: 'ファイルサイズが10MBを超えています' }
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
    return { valid: false, error: 'サポートされていないファイル形式です（.xlsx, .xls, .csv のみ）' }
  }

  return { valid: true }
}
