/**
 * Base Agent Interface
 * All specialized agents implement this interface
 */

import { EnrichmentField, AgentContext, AgentResult } from '../types';
import { FirecrawlService } from '../FirecrawlService';
import { AISynthesisService } from '../AISynthesisService';

export interface Agent {
  name: string;
  execute(
    context: AgentContext,
    fields: EnrichmentField[],
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): Promise<AgentResult>;
}

export abstract class AgentBase implements Agent {
  abstract name: string;

  constructor(
    protected firecrawl: FirecrawlService,
    protected ai: AISynthesisService
  ) {}

  abstract execute(
    context: AgentContext,
    fields: EnrichmentField[],
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): Promise<AgentResult>;

  /**
   * Helper: Log progress
   */
  protected logProgress(
    message: string,
    type: 'info' | 'success' | 'warning' = 'info',
    onProgress?: (message: string, type: 'info' | 'success' | 'warning') => void
  ): void {
    console.log(`[${this.name}] ${message}`);
    if (onProgress) {
      onProgress(message, type);
    }
  }

  /**
   * Helper: Check if this agent should handle a field
   */
  protected shouldHandleField(field: EnrichmentField, keywords: string[]): boolean {
    const fieldText = `${field.name} ${field.displayName} ${field.description}`.toLowerCase();
    return keywords.some(keyword => fieldText.includes(keyword.toLowerCase()));
  }
}
