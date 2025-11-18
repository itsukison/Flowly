/**
 * Gemini API Service for AI-powered conversations and enrichment
 * Handles intelligent chat interactions for data collection requirements
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BUSINESS_INTELLIGENCE_TEMPLATES, suggestTemplate, getFieldTemplate } from './BusinessIntelligenceTemplates';

// Interface for conversation messages
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Interface for enrichment requirements
export interface EnrichmentRequirements {
  rowCount: number;
  targetColumns: string[];
  dataType: string;
  filters?: Record<string, any>;
  specifications?: string;
}

// Interface for conversation state
export interface ConversationState {
  messages: ChatMessage[];
  currentStep: 'greeting' | 'rowCount' | 'columns' | 'dataType' | 'specifications' | 'confirmation' | 'complete';
  requirements: Partial<EnrichmentRequirements>;
  tableContext?: {
    tableName: string;
    columns: Array<{ name: string; type: string; label?: string }>;
  };
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  /**
   * Start a new enrichment conversation
   */
  async startConversation(tableContext: ConversationState['tableContext']): Promise<{
    message: string;
    state: ConversationState;
  }> {
    // Fixed greeting message - no need to generate with AI
    const columnList = tableContext?.columns.map(c => c.label || c.name).slice(0, 5).join('、') || '';
    const moreColumns = (tableContext?.columns.length || 0) > 5 ? `など${tableContext?.columns.length}列` : '';
    
    const initialMessage = `こんにちは！「${tableContext?.tableName}」テーブルにビジネスデータを生成します。以下の情報を教えてください：

1. レコード数：何件生成しますか？（1〜1000件）
2. 対象列：どの列に入力しますか？
   利用可能：${columnList}${moreColumns}
3. データタイプ：どんな企業データが必要ですか？
   例：SaaS企業、製造業、医療機関など
4. 詳細要件（任意）：地域、規模、業種などの条件

一度にすべて教えていただいても、一つずつ答えていただいても構いません。`;

    const state: ConversationState = {
      messages: [
        {
          role: 'assistant',
          content: initialMessage,
          timestamp: new Date(),
        }
      ],
      currentStep: 'greeting',
      requirements: {},
      tableContext,
    };

    return {
      message: initialMessage,
      state,
    };
  }

  /**
   * Convert Japanese numbers to Arabic numerals
   */
  private convertJapaneseNumber(text: string): number | null {
    const japaneseNumbers: Record<string, number> = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '百': 100, '千': 1000
    };

    // Try to match patterns like 五個, 十件, etc.
    const patterns = [
      /([一二三四五六七八九十百千]+)(個|件|つ)/,
      /([一二三四五六七八九十百千]+)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const japaneseNum = match[1];
        let result = 0;
        let temp = 0;

        for (let i = 0; i < japaneseNum.length; i++) {
          const char = japaneseNum[i];
          const value = japaneseNumbers[char];

          if (value >= 10) {
            // Multiplier (十, 百, 千)
            temp = temp === 0 ? value : temp * value;
          } else {
            // Digit (一-九)
            temp += value;
          }
        }

        result = temp || result;
        if (result >= 1 && result <= 1000) {
          return result;
        }
      }
    }

    return null;
  }

  /**
   * Find columns that semantically match a user term
   */
  private getColumnSemanticMatches(
    userInput: string,
    columns: Array<{ name: string; label?: string; type: string }>
  ): string[] {
    const input = userInput.toLowerCase();
    const selectedColumns: string[] = [];

    // Semantic mappings for common terms
    const semanticMappings: Record<string, string[]> = {
      '連絡先': ['電話', 'phone', 'tel', 'メール', 'email', 'mail', '連絡'],
      '従業員': ['従業員', 'employee', '社員', '人数', 'スタッフ', 'staff'],
      '売上': ['売上', '売り上げ', 'revenue', 'gmv', '収益', '売上高'],
      '会社': ['会社', '企業', 'company', 'name', '名前', '社名'],
      '住所': ['住所', '所在地', 'address', '場所', 'location'],
      '業種': ['業種', '業界', 'industry', '分野', 'sector'],
      '規模': ['規模', 'size', 'scale', '大きさ'],
      '設立': ['設立', '創業', 'founded', 'established'],
      '資金': ['資金', 'funding', '調達', '投資'],
      'url': ['url', 'website', 'サイト', 'ウェブ', 'web'],
    };

    // First, try exact and partial matching
    columns.forEach(column => {
      const columnName = column.name.toLowerCase();
      const columnLabel = (column.label || '').toLowerCase();

      // Exact match
      if (input.includes(columnName) || input.includes(columnLabel)) {
        if (!selectedColumns.includes(column.name)) {
          selectedColumns.push(column.name);
        }
      }
    });

    // Then, try semantic matching for each term in user input
    for (const [userTerm, keywords] of Object.entries(semanticMappings)) {
      if (input.includes(userTerm)) {
        columns.forEach(column => {
          const columnName = column.name.toLowerCase();
          const columnLabel = (column.label || '').toLowerCase();

          // Check if column matches any of the semantic keywords
          const matches = keywords.some(keyword => 
            columnName.includes(keyword.toLowerCase()) || 
            columnLabel.includes(keyword.toLowerCase())
          );

          if (matches && !selectedColumns.includes(column.name)) {
            selectedColumns.push(column.name);
          }
        });
      }
    }

    return selectedColumns;
  }

  /**
   * Extract requirements from user input intelligently
   */
  private extractRequirementsFromInput(
    userInput: string,
    currentRequirements: Partial<EnrichmentRequirements>,
    tableContext?: ConversationState['tableContext']
  ): Partial<EnrichmentRequirements> {
    const extracted: Partial<EnrichmentRequirements> = { ...currentRequirements };

    // Extract row count if not already set
    if (!extracted.rowCount) {
      // Try Arabic numerals first
      const arabicMatch = userInput.match(/(\d+)\s*(個|件|つ)?/);
      if (arabicMatch) {
        const count = parseInt(arabicMatch[1]);
        if (count >= 1 && count <= 1000) {
          extracted.rowCount = count;
        }
      } else {
        // Try Japanese numbers
        const japaneseCount = this.convertJapaneseNumber(userInput);
        if (japaneseCount) {
          extracted.rowCount = japaneseCount;
        }
      }
    }

    // Extract column names if not already set
    if (!extracted.targetColumns || extracted.targetColumns.length === 0) {
      const availableColumns = tableContext?.columns || [];
      const selectedColumns = this.getColumnSemanticMatches(userInput, availableColumns);

      if (selectedColumns.length > 0) {
        extracted.targetColumns = selectedColumns;
      }
    }

    // Extract data type if not already set
    if (!extracted.dataType) {
      const dataTypeKeywords = [
        { keyword: 'ecommerce', extract: 'ecommerce' },
        { keyword: 'Eコマース', extract: 'Eコマース' },
        { keyword: 'SaaS', extract: 'SaaS' },
        { keyword: 'saas', extract: 'SaaS' },
        { keyword: '製造業', extract: '製造業' },
        { keyword: '医療', extract: '医療' },
        { keyword: 'スタートアップ', extract: 'スタートアップ' },
        { keyword: 'テクノロジー', extract: 'テクノロジー' },
        { keyword: 'IT', extract: 'IT' },
        { keyword: 'フィンテック', extract: 'フィンテック' },
        { keyword: '小売', extract: '小売' },
        { keyword: 'サービス', extract: 'サービス' },
        { keyword: 'コンサル', extract: 'コンサル' },
        { keyword: '金融', extract: '金融' },
        { keyword: '不動産', extract: '不動産' },
        { keyword: '教育', extract: '教育' },
      ];

      for (const { keyword, extract } of dataTypeKeywords) {
        if (userInput.toLowerCase().includes(keyword.toLowerCase())) {
          // Extract just the data type, not the entire query
          let dataType = extract;
          
          // Add country/region if mentioned
          if (userInput.includes('日本')) {
            dataType = `日本の${dataType}`;
          }
          
          // Add company/企業 suffix
          if (!dataType.includes('企業') && !dataType.includes('会社')) {
            dataType += '企業';
          }
          
          extracted.dataType = dataType;
          break;
        }
      }
      
      // Fallback: if no keyword matched but contains 企業/会社, extract the phrase
      if (!extracted.dataType && (userInput.includes('企業') || userInput.includes('会社'))) {
        // Extract the main business type phrase (e.g., "日本のecommerce会社")
        const match = userInput.match(/(日本の)?([^\s、。]+)(企業|会社)/);
        if (match) {
          extracted.dataType = match[0];
        }
      }
    }

    // Extract specifications if mentioned (but clean it up)
    const specKeywords = ['地域', '場所', '規模', 'スケール', '従業員', '売上', '資金', '設立', '本社', '日本', '東京', '大阪'];
    const hasSpecs = specKeywords.some(keyword => userInput.includes(keyword));
    
    if (hasSpecs && !extracted.specifications) {
      // Extract only the specification part, not the entire query
      let specs = '';
      
      if (userInput.includes('スケールがあまり多くない') || userInput.includes('小規模')) {
        specs += '小規模 ';
      }
      if (userInput.includes('大規模') || userInput.includes('スケールが大きい')) {
        specs += '大規模 ';
      }
      if (userInput.includes('東京')) {
        specs += '東京 ';
      }
      if (userInput.includes('大阪')) {
        specs += '大阪 ';
      }
      
      extracted.specifications = specs.trim() || undefined;
    }

    return extracted;
  }

  /**
   * Process user input and generate AI response
   */
  async processUserInput(
    userInput: string,
    currentState: ConversationState
  ): Promise<{
    message: string;
    state: ConversationState;
    isComplete: boolean;
  }> {
    // Add user message to conversation
    const updatedState: ConversationState = {
      ...currentState,
      messages: [
        ...currentState.messages,
        {
          role: 'user' as const,
          content: userInput,
          timestamp: new Date(),
        }
      ],
    };

    // Extract all possible requirements from user input
    const extractedRequirements = this.extractRequirementsFromInput(
      userInput,
      updatedState.requirements,
      updatedState.tableContext
    );

    // Update state with extracted requirements
    updatedState.requirements = extractedRequirements;

    // Process current step with smart extraction
    const stepResult = await this.processCurrentStep(userInput, updatedState);

    // Merge updated state
    const finalState: ConversationState = {
      ...updatedState,
      ...stepResult.state,
      messages: [
        ...updatedState.messages,
        {
          role: 'assistant' as const,
          content: stepResult.message,
          timestamp: new Date(),
        }
      ],
    };

    return {
      message: stepResult.message,
      state: finalState,
      isComplete: stepResult.isComplete,
    };
  }



  /**
   * Generate confirmation message
   */
  private generateConfirmationMessage(state: ConversationState): {
    message: string;
    state: Partial<ConversationState>;
    isComplete: boolean;
  } {
    const reqs = state.requirements as EnrichmentRequirements;
    const availableColumns = state.tableContext?.columns || [];
    
    const columnLabels = reqs.targetColumns.map(name => {
      const col = availableColumns.find(c => c.name === name);
      return col?.label || name;
    }).join('、');

    const summary = `要件を確認させてください：

レコード数：${reqs.rowCount}件
対象列：${columnLabels}
データタイプ：${reqs.dataType}
${reqs.specifications ? `詳細要件：${reqs.specifications}` : ''}

この内容で正しいですか？「はい」と入力するとデータ生成を開始します。変更が必要な場合は、修正したい内容をお知らせください。`;

    return {
      message: summary,
      state: {
        currentStep: 'confirmation' as const,
        requirements: reqs,
      },
      isComplete: false,
    };
  }

  /**
   * Process the current conversation step
   */
  private async processCurrentStep(
    userInput: string,
    state: ConversationState
  ): Promise<{
    message: string;
    state: Partial<ConversationState>;
    isComplete: boolean;
  }> {
    // If in confirmation step, handle confirmation
    if (state.currentStep === 'confirmation') {
      return this.handleConfirmationStep(userInput, state);
    }

    // Otherwise, use smart greeting handler that checks what we have
    return this.handleGreetingStep(userInput, state);
  }

  /**
   * Handle greeting step - check what information we have and ask for missing pieces
   */
  private async handleGreetingStep(userInput: string, state: ConversationState) {
    const reqs = state.requirements;
    const availableColumns = state.tableContext?.columns || [];

    // Check what we already have
    const hasRowCount = !!reqs.rowCount;
    const hasColumns = !!(reqs.targetColumns && reqs.targetColumns.length > 0);
    const hasDataType = !!reqs.dataType;

    // If we have everything, move to confirmation
    if (hasRowCount && hasColumns && hasDataType) {
      return this.generateConfirmationMessage(state);
    }

    // Build response asking for missing information
    let message = '';
    const missing: string[] = [];

    if (!hasRowCount) {
      missing.push('レコード数（1〜1000件）');
    }
    if (!hasColumns) {
      missing.push('対象列');
    }
    if (!hasDataType) {
      missing.push('データタイプ（例：SaaS企業、製造業など）');
    }

    if (missing.length === 3) {
      // Nothing provided yet, ask for everything
      message = '以下の情報を教えてください：\n\n';
      message += `1. ${missing[0]}\n`;
      message += `2. ${missing[1]}\n`;
      message += `3. ${missing[2]}\n\n`;
      message += '一度にすべて、または一つずつ答えていただけます。';
    } else {
      // Some information provided, acknowledge and ask for rest
      const provided: string[] = [];
      if (hasRowCount) {
        provided.push(`レコード数：${reqs.rowCount}件`);
      }
      if (hasColumns) {
        const columnLabels = reqs.targetColumns!.map(name => {
          const col = availableColumns.find(c => c.name === name);
          return col?.label || name;
        }).join('、');
        provided.push(`対象列：${columnLabels}`);
      }
      if (hasDataType) {
        provided.push(`データタイプ：${reqs.dataType}`);
      }

      message = '以下の情報を受け取りました：\n\n' + provided.join('\n') + '\n\n';
      message += 'あと以下の情報が必要です：\n';
      missing.forEach((item, idx) => {
        message += `${idx + 1}. ${item}\n`;
      });
    }

    return {
      message,
      state: { 
        currentStep: 'greeting' as const,
        requirements: reqs,
      },
      isComplete: false,
    };
  }



  /**
   * Handle confirmation and complete conversation
   */
  private async handleConfirmationStep(userInput: string, state: ConversationState) {
    const confirmation = userInput.toLowerCase();
    const confirmKeywords = ['はい', '正しい', 'ok', '完璧', '開始', '生成', 'よろしく', 'お願い', 'スタート'];
    const isConfirmed = confirmKeywords.some(keyword => confirmation.includes(keyword));

    if (isConfirmed) {
      return {
        message: `完璧です！データ生成プロセスを開始します。指定された要件に基づいて${state.requirements.rowCount}件のレコードを生成します。

生成されたデータは、ソースの帰属と信頼度スコアとともにテーブルに表示されます。`,
        state: {
          currentStep: 'complete' as const,
        },
        isComplete: true,
      };
    } else {
      return {
        message: `要件の修正をお手伝いします。何を変更しますか？

• レコード数
• 対象列
• データタイプまたは詳細要件

調整が必要な内容をお知らせください。`,
        state: {
          currentStep: 'columns' as const, // Go back to allow modifications
        },
        isComplete: false,
      };
    }
  }

  /**
   * Suggest business templates based on user input
   */
  async suggestBusinessTemplate(userInput: string, tableColumns: Array<{ name: string; type: string; label?: string }>): Promise<{
    template: any;
    message: string;
  } | null> {
    // Extract keywords from user input
    const keywords = userInput.toLowerCase()
      .split(/[,\s]+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'or', 'for', 'with', 'that', 'this', 'from', 'have', 'are', 'was', 'will', 'been'].includes(word));

    // Try to suggest template based on keywords
    const suggestedTemplate = suggestTemplate(tableColumns);

    if (suggestedTemplate) {
      return {
        template: suggestedTemplate,
        message: `Based on your table structure, I suggest using the "${suggestedTemplate.name}" template. This template includes fields that match your columns:

${suggestedTemplate.fields.slice(0, 5).map(f => `• ${f.label}: ${f.description}`).join('\n')}

Would you like me to use this template, or would you prefer to specify different requirements?`,
      };
    }

    return null;
  }

  /**
   * Get field suggestions for table columns
   */
  getFieldSuggestions(columns: Array<{ name: string; type: string; label?: string }>): Array<{
    column: string;
    template: any;
    confidence: number;
  }> {
    const suggestions: Array<{
      column: string;
      template: any;
      confidence: number;
    }> = [];

    columns.forEach(column => {
      const template = getFieldTemplate(column.name) || getFieldTemplate(column.label || '');
      if (template) {
        suggestions.push({
          column: column.name,
          template,
          confidence: template.name === column.name ? 0.9 : 0.7,
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}