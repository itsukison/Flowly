/**
 * Type definitions for record insertion
 */

export interface GeneratedCompany {
  name: string;
  website: string;
  fields: Array<{
    name: string;
    value: any;
    confidence: number;
    source: 'knowledge' | 'url_context' | 'firecrawl';
    sourceUrl?: string;
  }>;
}

export interface RecordInsert {
  table_id: string;
  organization_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  status: string;
  data: Record<string, any>;
  created_by: string;
  is_ai_generated: boolean;
}

export interface RecordMetadata {
  field_confidence: Record<string, number>;
  enriched_fields: string[];
  enrichment_method: 'knowledge' | 'url_context' | 'firecrawl' | 'hybrid';
  sources: Array<{
    field: string;
    source: string;
    url?: string;
    confidence: number;
  }>;
}

export interface ColumnDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'select' | 'multiselect' | 'textarea' | 'url' | 'boolean';
  display_order: number;
}

export interface FieldAnalysis {
  existingColumns: Array<{ name: string; type: string }>;
  newColumns: ColumnDefinition[];
}

export interface InsertionResult {
  success: number;
  failed: number;
  insertedRecords: string[];
  errors: Array<{ company: string; error: string }>;
}

export type ColumnType = 'text' | 'number' | 'date' | 'email' | 'phone' | 'select' | 'multiselect' | 'textarea' | 'url' | 'boolean';

export type ProgressCallback = (message: {
  stage: 'insertion' | 'complete';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  company?: string;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}) => void;
