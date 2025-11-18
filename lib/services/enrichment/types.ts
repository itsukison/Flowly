/**
 * Type definitions for AI data generation and enrichment
 */

export interface EnrichmentRequirements {
  rowCount: number;
  targetColumns: string[];
  dataType: string;
  specifications?: string;
}

export interface SearchResult {
  url: string;
  title: string;
  content: string;
  markdown?: string;
}

export interface ScrapedContent {
  url: string;
  markdown: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    ogImage?: string;
  };
}

export interface SourceAttribution {
  field: string;
  url: string;
  confidence: number;
}

export interface GeneratedRecord {
  index: number;
  data: Record<string, any>;
  sources: SourceAttribution[];
  status: 'success' | 'failed';
  error?: string;
}

export interface ProgressUpdate {
  jobId: string;
  totalRecords: number;
  completedRecords: number;
  failedRecords: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  currentRecord?: number;
  message?: string;
  error?: string;
}

export interface AgentContext {
  dataType: string;
  specifications?: string;
  previousResults: Record<string, any>;
  recordIndex: number;
}

export interface AgentResult {
  agentName: string;
  data: Record<string, any>;
  sources: SourceAttribution[];
  confidence: number;
  searchQueries?: string[];
  error?: string;
}

export interface EnrichmentField {
  name: string;
  displayName: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
}
