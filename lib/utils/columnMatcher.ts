export interface ColumnMapping {
  sourceColumn: string
  targetField: string
  confidence: number // 0-1
  suggestions: string[]
}

// Japanese column name variations
const columnVariations: Record<string, string[]> = {
  name: ['名前', '氏名', '顧客名', 'お名前', 'name', 'customer_name', '担当者名', '担当者'],
  name_furigana: ['フリガナ', 'ふりがな', 'かな', 'furigana', 'kana', '読み'],
  email: ['メール', 'メールアドレス', 'email', 'mail', 'e-mail', 'Email', 'EMAIL'],
  phone: ['電話', '電話番号', 'tel', 'phone', '携帯', '連絡先', 'TEL', 'Phone', '電話番号'],
  company_name: ['会社', '会社名', '企業名', '社名', 'company', 'company_name', '法人名', '取引先'],
  address: ['住所', '所在地', 'address', 'location', 'Address', '本社所在地'],
  industry: ['業種', '業界', 'industry', '事業内容', '業態'],
  employee_count: ['従業員数', '社員数', 'employee_count', 'employees', '人数'],
  status: ['ステータス', '状態', 'status', 'Status', '進捗'],
}

// Normalize Japanese text for matching
function normalizeJapanese(text: string): string {
  return text
    .normalize('NFKC') // Convert full-width to half-width
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[_-]/g, '') // Remove separators
}

// Calculate string similarity (simple Levenshtein-based)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

export function matchColumn(sourceColumn: string): ColumnMapping {
  const normalized = normalizeJapanese(sourceColumn)
  
  // Try exact match first
  for (const [field, variations] of Object.entries(columnVariations)) {
    for (const variation of variations) {
      if (normalizeJapanese(variation) === normalized) {
        return {
          sourceColumn,
          targetField: field,
          confidence: 1.0,
          suggestions: [],
        }
      }
    }
  }

  // Try partial match
  for (const [field, variations] of Object.entries(columnVariations)) {
    for (const variation of variations) {
      const normalizedVariation = normalizeJapanese(variation)
      if (normalized.includes(normalizedVariation) || normalizedVariation.includes(normalized)) {
        return {
          sourceColumn,
          targetField: field,
          confidence: 0.9,
          suggestions: [],
        }
      }
    }
  }

  // Try fuzzy match
  let bestMatch: { field: string; score: number } | null = null
  
  for (const [field, variations] of Object.entries(columnVariations)) {
    for (const variation of variations) {
      const score = similarity(normalized, normalizeJapanese(variation))
      if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { field, score }
      }
    }
  }

  if (bestMatch) {
    return {
      sourceColumn,
      targetField: bestMatch.field,
      confidence: bestMatch.score,
      suggestions: [],
    }
  }

  // No match found
  return {
    sourceColumn,
    targetField: '',
    confidence: 0,
    suggestions: Object.keys(columnVariations),
  }
}

export function matchAllColumns(headers: string[]): ColumnMapping[] {
  return headers.map(header => matchColumn(header))
}

export function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    name: '名前',
    name_furigana: 'フリガナ',
    email: 'メール',
    phone: '電話',
    company_name: '会社名',
    address: '住所',
    industry: '業種',
    employee_count: '従業員数',
    status: 'ステータス',
  }
  return labels[field] || field
}

export function isRequiredField(field: string): boolean {
  return field === 'name'
}
