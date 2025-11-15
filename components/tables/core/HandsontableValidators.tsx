/**
 * Custom validators for Handsontable cells
 * These validators ensure data integrity for different field types
 */

/**
 * Email validator
 * Validates that the value is a valid email address
 */
export function emailValidator(value: any, callback: (valid: boolean) => void) {
  if (!value) {
    callback(true) // Empty is valid (use required validator separately)
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  callback(emailRegex.test(String(value)))
}

/**
 * Phone validator
 * Validates that the value is a valid phone number (flexible format)
 */
export function phoneValidator(value: any, callback: (valid: boolean) => void) {
  if (!value) {
    callback(true) // Empty is valid
    return
  }

  // Allow various phone formats: +81-90-1234-5678, 090-1234-5678, 09012345678, etc.
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  const hasEnoughDigits = String(value).replace(/\D/g, '').length >= 10
  
  callback(phoneRegex.test(String(value)) && hasEnoughDigits)
}

/**
 * URL validator
 * Validates that the value is a valid URL
 */
export function urlValidator(value: any, callback: (valid: boolean) => void) {
  if (!value) {
    callback(true) // Empty is valid
    return
  }

  try {
    new URL(String(value))
    callback(true)
  } catch {
    // Also accept URLs without protocol
    const urlRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
    callback(urlRegex.test(String(value)))
  }
}

/**
 * Required validator
 * Validates that the value is not empty
 */
export function requiredValidator(value: any, callback: (valid: boolean) => void) {
  const isValid = value !== null && value !== undefined && String(value).trim() !== ''
  callback(isValid)
}

/**
 * Number validator
 * Validates that the value is a valid number
 */
export function numberValidator(value: any, callback: (valid: boolean) => void) {
  if (!value) {
    callback(true) // Empty is valid
    return
  }

  callback(!isNaN(Number(value)))
}
