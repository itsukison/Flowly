/**
 * Data transformation utilities for records table
 * Handles conversion between form data and hybrid JSONB structure
 */

// Common fields that are stored as top-level columns
const COMMON_FIELDS = ['name', 'email', 'company', 'status'] as const;

export interface RecordData {
  name?: string | null;
  email?: string | null;
  company?: string | null;
  status?: string | null;
  data: Record<string, any>;
}

/**
 * Transform form data to record structure
 * Separates common fields from custom fields
 */
export function transformToRecord(
  formData: Record<string, any>,
  tableSchema?: any
): RecordData {
  const record: RecordData = {
    name: null,
    email: null,
    company: null,
    status: null,
    data: {},
  };

  Object.entries(formData).forEach(([key, value]) => {
    if (COMMON_FIELDS.includes(key as any)) {
      record[key as keyof RecordData] = value;
    } else {
      // All other fields go into data JSONB
      record.data[key] = value;
    }
  });

  return record;
}

/**
 * Transform record from database to display format
 * Merges common fields with data JSONB
 */
export function transformFromRecord(record: any): Record<string, any> {
  const { name, email, company, status, data, ...metadata } = record;

  return {
    ...metadata,
    name,
    email,
    company,
    status,
    ...(data || {}),
  };
}

/**
 * Extract common fields from form data
 */
export function extractCommonFields(formData: Record<string, any>) {
  return {
    name: formData.name || null,
    email: formData.email || null,
    company: formData.company || formData.company_name || null,
    status: formData.status || null,
  };
}

/**
 * Extract custom fields (everything except common fields)
 */
export function extractCustomFields(formData: Record<string, any>) {
  const customFields: Record<string, any> = {};

  Object.entries(formData).forEach(([key, value]) => {
    if (!COMMON_FIELDS.includes(key as any) && key !== 'company_name') {
      customFields[key] = value;
    }
  });

  return customFields;
}

/**
 * Validate data against table schema
 */
export function validateAgainstSchema(
  data: Record<string, any>,
  schema: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema?.columns) {
    return { valid: true, errors };
  }

  // Check required fields
  schema.columns.forEach((column: any) => {
    if (column.required) {
      const value = data[column.name];
      if (value === null || value === undefined || value === '') {
        errors.push(`${column.label || column.name} is required`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
