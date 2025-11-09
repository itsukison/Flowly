export interface ValidationError {
  row: number
  field: string
  error: string
  value: any
}

// Normalize phone numbers (Japanese format)
export function normalizePhone(phone: string): string {
  if (!phone) return ''
  return phone.replace(/[^0-9]/g, '')
}

// Extract company domain from email
export function extractDomain(email: string): string {
  if (!email || !email.includes('@')) return ''
  return email.split('@')[1] || ''
}

// Normalize Japanese text
export function normalizeText(text: string): string {
  if (!text) return ''
  return text.normalize('NFKC').trim()
}

// Validate email format
export function isValidEmail(email: string): boolean {
  if (!email) return true // Empty is valid (optional field)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate Japanese phone number
export function isValidJapanesePhone(phone: string): boolean {
  if (!phone) return true // Empty is valid (optional field)
  const normalized = normalizePhone(phone)
  // Japanese phone numbers are typically 10-11 digits
  return normalized.length >= 10 && normalized.length <= 11
}

// Validate row data
export function validateRow(
  row: Record<string, any>,
  rowIndex: number,
  mappings: Record<string, string>
): ValidationError[] {
  const errors: ValidationError[] = []

  // Check required field (name)
  const nameField = Object.keys(mappings).find(k => mappings[k] === 'name')
  if (nameField) {
    const nameValue = row[nameField]
    if (!nameValue || String(nameValue).trim() === '') {
      errors.push({
        row: rowIndex,
        field: 'name',
        error: '名前は必須です',
        value: nameValue,
      })
    }
  } else {
    errors.push({
      row: rowIndex,
      field: 'name',
      error: '名前フィールドがマッピングされていません',
      value: null,
    })
  }

  // Validate email format
  const emailField = Object.keys(mappings).find(k => mappings[k] === 'email')
  if (emailField && row[emailField]) {
    const emailValue = String(row[emailField]).trim()
    if (emailValue && !isValidEmail(emailValue)) {
      errors.push({
        row: rowIndex,
        field: 'email',
        error: '無効なメール形式',
        value: emailValue,
      })
    }
  }

  // Validate phone format
  const phoneField = Object.keys(mappings).find(k => mappings[k] === 'phone')
  if (phoneField && row[phoneField]) {
    const phoneValue = String(row[phoneField]).trim()
    if (phoneValue && !isValidJapanesePhone(phoneValue)) {
      errors.push({
        row: rowIndex,
        field: 'phone',
        error: '無効な電話番号',
        value: phoneValue,
      })
    }
  }

  // Validate employee count (must be number)
  const employeeField = Object.keys(mappings).find(k => mappings[k] === 'employee_count')
  if (employeeField && row[employeeField]) {
    const employeeValue = row[employeeField]
    if (employeeValue && isNaN(Number(employeeValue))) {
      errors.push({
        row: rowIndex,
        field: 'employee_count',
        error: '従業員数は数値である必要があります',
        value: employeeValue,
      })
    }
  }

  return errors
}

// Transform row data according to mappings
export function transformRow(
  row: Record<string, any>,
  mappings: Record<string, string>,
  organizationId: string,
  userId: string
): any {
  const transformed: any = {
    organization_id: organizationId,
    created_by: userId,
  }

  for (const [sourceColumn, targetField] of Object.entries(mappings)) {
    if (!targetField || targetField === '') continue

    let value = row[sourceColumn]
    
    if (value === null || value === undefined || value === '') {
      continue
    }

    // Normalize based on field type
    switch (targetField) {
      case 'name':
      case 'name_furigana':
      case 'company_name':
      case 'address':
      case 'industry':
        transformed[targetField] = normalizeText(String(value))
        break

      case 'email':
        const email = normalizeText(String(value))
        transformed.email = email
        // Auto-extract domain
        if (email && !transformed.company_domain) {
          transformed.company_domain = extractDomain(email)
        }
        break

      case 'phone':
        transformed.phone = normalizePhone(String(value))
        break

      case 'employee_count':
        const num = Number(value)
        if (!isNaN(num)) {
          transformed.employee_count = Math.floor(num)
        }
        break

      case 'status':
        // Validate status value
        const validStatuses = ['リード', '商談中', '契約', '運用中', '休眠']
        const status = normalizeText(String(value))
        if (validStatuses.includes(status)) {
          transformed.status = status
        } else {
          transformed.status = 'リード' // Default
        }
        break

      default:
        transformed[targetField] = normalizeText(String(value))
    }
  }

  // Set default status if not provided
  if (!transformed.status) {
    transformed.status = 'リード'
  }

  return transformed
}

// Batch transform rows
export function transformRows(
  rows: Record<string, any>[],
  mappings: Record<string, string>,
  organizationId: string,
  userId: string
): any[] {
  return rows.map(row => transformRow(row, mappings, organizationId, userId))
}
