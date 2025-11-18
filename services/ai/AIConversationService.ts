/**
 * AI Conversation Service
 * Manages AI enrichment conversations with database persistence
 */

import { GeminiService, ConversationState, EnrichmentRequirements } from "./GeminiService";

export interface ConversationSession {
  id: string;
  user_id: string;
  table_id: string;
  organization_id: string;
  conversation: any[];
  current_step: string;
  requirements: any;
  status: string;
  started_at: string;
  updated_at: string;
}

export interface ConversationStartRequest {
  tableId: string;
  tableName: string;
  columns: Array<{
    name: string;
    type: string;
    label: string;
  }>;
  userId: string;
  organizationId: string;
}

export interface ConversationProcessRequest {
  sessionId: string;
  userInput: string;
  state?: ConversationState;
}

export interface ConversationResponse {
  sessionId: string;
  message: string;
  state?: ConversationState;
  isComplete: boolean;
  requirements?: EnrichmentRequirements;
}

export class AIConversationService {
  private geminiService: GeminiService;

  constructor() {
    this.geminiService = new GeminiService();
  }

  /**
   * Start a new AI conversation session
   */
  async startConversation(request: ConversationStartRequest): Promise<ConversationResponse> {
    try {
      // Start Gemini conversation
      const geminiResponse = await this.geminiService.startConversation({
        tableName: request.tableName,
        columns: request.columns,
      });

      // For now, use temporary session ID
      // Database session creation will be handled by the API route
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        sessionId,
        message: geminiResponse.message,
        state: geminiResponse.state,
        isComplete: false,
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  /**
   * Process user input and continue conversation
   */
  async processUserInput(request: ConversationProcessRequest & { state: ConversationState }): Promise<ConversationResponse> {
    try {
      // Process with Gemini using provided state
      const geminiResponse = await this.geminiService.processUserInput(
        request.userInput,
        request.state
      );

      // Session updates will be handled by the API route if needed

      return {
        sessionId: request.sessionId,
        message: geminiResponse.message,
        state: geminiResponse.state,
        isComplete: geminiResponse.isComplete,
        requirements: geminiResponse.isComplete ? geminiResponse.state.requirements as EnrichmentRequirements : undefined,
      };
    } catch (error) {
      console.error('Error processing user input:', error);
      throw error;
    }
  }


}