# AI Data Generation - Gemini 2.0 Flash Thinking Refactor

**Status**: Planning Phase  
**Created**: 2024-11-19  
**Objective**: Simplify architecture using Gemini-3-pro-preview enhanced reasoning capabilities

---

## Executive Summary

### Current Problems
1. **Over-engineered discovery**: SerpAPI → Gemini filter → Firecrawl scrape → Gemini extract
2. **Unreliable**: Depends on finding quality "list" websites
3. **Expensive**: ~70 API calls for 5 records
4. **Slow**: 2-3 minutes for 5 records
5. **Complex**: 4 specialized agents + multiple services

### Proposed Solution
Leverage Gemini 2.0 Flash Thinking to:
1. **Directly suggest companies** from its knowledge base
2. **Scrape official websites** for current data
3. **Extract all fields at once** using enhanced reasoning
4. **Fallback to search** when needed

### Expected Improvements
- **84% cost reduction**: 70 → 11 API calls per 5 records
- **4x faster**: 2-3 min → 30-45 sec
- **Simpler**: 1 agent instead of 4
- **More reliable**: Official websites vs random lists
- **Better accuracy**: Enhanced reasoning for extraction

---

## Architecture Comparison

### Current Architecture (Complex)

```
User Request
  ↓
CompanyDiscoveryAgent
  ├─ SerpAPIService.search()          [API call 1]
  ├─ GeminiURLSelector.filter()       [API call 2]
  ├─ FirecrawlService.scrape() × 7    [API calls 3-9]
  └─ AISynthesisService.extract()     [API call 10]
  ↓
For each of 5 records:
  ├─ ContactInfoAgent
  │   ├─ Firecrawl.search()           [API call 11]
  │   ├─ Firecrawl.scrape()           [API call 12]
  │   └─ Gemini.extract()             [API call 13]
  ├─ CompanyProfileAgent
  │   ├─ Firecrawl.search()           [API call 14]
  │   ├─ Firecrawl.scrape()           [API call 15]
  │   └─ Gemini.extract()             [API call 16]
  └─ GeneralAgent
      ├─ Firecrawl.search()           [API call 17]
      ├─ Firecrawl.scrape()           [API call 18]
      └─ Gemini.extract()             [API call 19]

Total: ~70 API calls for 5 records
```

### New Architecture (Simplified)

```
User Request
  ↓
IntelligentDataAgent.suggestCompanies()
  └─ Gemini 2.0 Flash Thinking        [API call 1]
     → Returns 5 companies with URLs
  ↓
For each of 5 companies:
  ├─ FirecrawlService.scrape(url)     [API call 2-6]
  │  (Fallback: search if URL fails)
  └─ IntelligentDataAgent.extractAllFields()
     └─ Gemini 2.0 Flash Thinking     [API call 7-11]
        → Extracts ALL fields at once

Total: ~11 API calls for 5 records
```

---

## Detailed Design

### 1. IntelligentDataAgent (New)

**Purpose**: Single unified agent using Gemini 2.0 Flash Thinking

**Location**: `Flowly/lib/services/enrichment/agents/IntelligentDataAgent.ts`

**Key Methods**:

```typescript
class IntelligentDataAgent {
  /**
   * Suggest companies matching criteria using Gemini's knowledge
   * Returns: Array of { name, website, reasoning }
   */
  async suggestCompanies(
    dataType: string,
    specifications: string | undefined,
    count: number,
    onProgress?: ProgressCallback
  ): Promise<CompanySuggestion[]>

  /**
   * Extract ALL requested fields from scraped content at once
   * Uses Gemini 2.0 Flash Thinking's enhanced reasoning
   */
  async extractAllFields(
    content: string,
    sourceUrl: string,
    fields: EnrichmentField[],
    context: ExtractionContext,
    onProgress?: ProgressCallback
  ): Promise<ExtractedData>

  /**
   * Validate company exists by attempting to scrape website
   */
  async validateCompany(
    companyName: string,
    websiteUrl: string
  ): Promise<boolean>

  /**
   * Fallback: Generate search queries when direct suggestion fails
   */
  async generateSearchQueries(
    dataType: string,
    specifications: string | undefined,
    count: number
  ): Promise<string[]>
}
```

**Example Usage**:

```typescript
// Suggest companies
const suggestions = await agent.suggestCompanies(
  "日本のecommerce会社",
  "スケールがあまり多くない会社",
  5
);
// Returns:
// [
//   { name: "BASE株式会社", website: "https://binc.jp", reasoning: "..." },
//   { name: "STORES株式会社", website: "https://stores.jp", reasoning: "..." },
//   ...
// ]

// Extract all fields at once
const extracted = await agent.extractAllFields(
  scrapedContent,
  "https://binc.jp",
  [
    { name: "company_name", ... },
    { name: "email", ... },
    { name: "employee_count", ... },
    { name: "revenue", ... }
  ],
  context
);
// Returns all fields in one call
```

---

### 2. Enhanced AISynthesisService

**Upgrade**: Switch from `gemini-2.5-flash` to `gemini-2.0-flash-thinking-exp`

**Location**: `Flowly/lib/services/enrichment/AISynthesisService.ts`

**Changes**:

```typescript
// Before
this.model = this.genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.3,
    ...
  },
});

// After
this.model = this.genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-thinking-exp', // Latest experimental model
  generationConfig: {
    temperature: 0.2, // Lower for more consistent suggestions
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  },
});
```

**New Methods**:

```typescript
/**
 * Suggest companies using Gemini's knowledge base
 */
async suggestCompanies(
  dataType: string,
  specifications: string | undefined,
  count: number
): Promise<CompanySuggestion[]>

/**
 * Extract all fields at once (replaces multiple specialized extractions)
 */
async extractAllFieldsUnified(
  content: string,
  sourceUrl: string,
  fields: EnrichmentField[],
  context: ExtractionContext
): Promise<ExtractedData>
```

---

### 3. Simplified DataGenerationOrchestrator

**Location**: `Flowly/lib/services/enrichment/DataGenerationOrchestrator.ts`

**New Flow**:

```typescript
async generateRecordsBatch(
  count: number,
  dataType: string,
  specifications: string | undefined,
  fields: EnrichmentField[],
  onProgress?: ProgressCallback
): Promise<GeneratedRecord[]> {
  
  // Phase 1: Get company suggestions from Gemini
  const suggestions = await this.intelligentAgent.suggestCompanies(
    dataType,
    specifications,
    count,
    onProgress
  );

  // Phase 2: For each company, scrape and extract
  const records: GeneratedRecord[] = [];
  
  for (const suggestion of suggestions) {
    try {
      // Try direct scrape of suggested URL
      let content: string;
      try {
        const scraped = await this.firecrawl.scrape({
          url: suggestion.website,
          formats: ['markdown'],
          onlyMainContent: true,
        });
        content = scraped.markdown;
      } catch (error) {
        // Fallback: Search for company
        const searchResults = await this.firecrawl.search({
          query: `${suggestion.name} 会社概要`,
          limit: 1,
          lang: 'ja',
        });
        content = searchResults[0]?.content || '';
      }

      // Extract ALL fields at once
      const extracted = await this.intelligentAgent.extractAllFields(
        content,
        suggestion.website,
        fields,
        { dataType, specifications, previousResults: {} },
        onProgress
      );

      records.push({
        index: records.length,
        data: extracted.data,
        sources: extracted.sources,
        status: 'success',
      });

    } catch (error) {
      // Handle error but continue with next company
      onProgress?.(`Failed to process ${suggestion.name}`, 'warning');
    }
  }

  return records;
}
```

**Key Simplifications**:
- No agent categorization
- No sequential agent execution
- Single extraction call per company
- Simpler error handling

---

### 4. Components to Remove

**Delete these files**:
- `lib/services/enrichment/SerpAPIService.ts`
- `lib/services/enrichment/GeminiURLSelector.ts`
- `lib/services/enrichment/agents/CompanyDiscoveryAgent.ts`
- `lib/services/enrichment/agents/ContactInfoAgent.ts`
- `lib/services/enrichment/agents/CompanyProfileAgent.ts`
- `lib/services/enrichment/agents/GeneralAgent.ts`
- `lib/services/enrichment/agents/AgentBase.ts`

**Keep these files**:
- `lib/services/enrichment/FirecrawlService.ts` (still needed for scraping)
- `lib/services/enrichment/AISynthesisService.ts` (upgrade to Gemini 2.0)
- `lib/services/enrichment/DataGenerationOrchestrator.ts` (simplify)
- `lib/services/enrichment/types.ts` (update)

---

## Implementation Plan

### Phase 1: Upgrade AI Service (Day 1)

**Tasks**:
- [ ] Update AISynthesisService to use `gemini-2.0-flash-thinking-exp`
- [ ] Add `suggestCompanies()` method
- [ ] Add `extractAllFieldsUnified()` method
- [ ] Test company suggestion quality
- [ ] Test unified extraction accuracy

**Files to Modify**:
- `lib/services/enrichment/AISynthesisService.ts`

**Testing**:
```typescript
// Test company suggestions
const suggestions = await ai.suggestCompanies(
  "日本のecommerce会社",
  "スケールがあまり多くない会社",
  5
);
console.log(suggestions);
// Should return: BASE, STORES, カラーミーショップ, etc.

// Test unified extraction
const extracted = await ai.extractAllFieldsUnified(
  scrapedContent,
  url,
  [
    { name: "company_name", ... },
    { name: "email", ... },
    { name: "employee_count", ... }
  ],
  context
);
console.log(extracted);
// Should extract all fields at once
```

---

### Phase 2: Create IntelligentDataAgent (Day 1-2)

**Tasks**:
- [ ] Create `IntelligentDataAgent.ts`
- [ ] Implement `suggestCompanies()` (delegates to AI service)
- [ ] Implement `extractAllFields()` (delegates to AI service)
- [ ] Implement `validateCompany()` (scrape validation)
- [ ] Implement `generateSearchQueries()` (fallback)
- [ ] Add comprehensive error handling
- [ ] Write unit tests

**Files to Create**:
- `lib/services/enrichment/agents/IntelligentDataAgent.ts`

**Key Features**:
- Validation of suggested companies
- Fallback to search-based discovery
- Progress tracking
- Error recovery

---

### Phase 3: Simplify Orchestrator (Day 2)

**Tasks**:
- [ ] Remove agent categorization logic
- [ ] Replace multi-agent flow with single-agent flow
- [ ] Update `generateRecordsBatch()` to use IntelligentDataAgent
- [ ] Remove `generateRecord()` (single record method)
- [ ] Simplify error handling
- [ ] Update progress messages

**Files to Modify**:
- `lib/services/enrichment/DataGenerationOrchestrator.ts`

**Before/After**:
```typescript
// Before: Complex agent orchestration
const fieldCategories = this.categorizeFields(fields);
const discoveryResult = await this.discoveryAgent.execute(...);
const contactResult = await this.contactAgent.execute(...);
const profileResult = await this.profileAgent.execute(...);
const generalResult = await this.generalAgent.execute(...);

// After: Simple single-agent flow
const suggestions = await this.intelligentAgent.suggestCompanies(...);
for (const suggestion of suggestions) {
  const scraped = await this.firecrawl.scrape(suggestion.website);
  const extracted = await this.intelligentAgent.extractAllFields(scraped, fields);
}
```

---

### Phase 4: Remove Deprecated Code (Day 2)

**Tasks**:
- [ ] Delete SerpAPIService.ts
- [ ] Delete GeminiURLSelector.ts
- [ ] Delete old agent files (4 agents + AgentBase)
- [ ] Remove SerpAPI from package.json
- [ ] Update environment variables (remove SERP_API_KEY)
- [ ] Update types.ts (remove unused types)
- [ ] Update documentation

**Files to Delete**:
- `lib/services/enrichment/SerpAPIService.ts`
- `lib/services/enrichment/GeminiURLSelector.ts`
- `lib/services/enrichment/agents/CompanyDiscoveryAgent.ts`
- `lib/services/enrichment/agents/ContactInfoAgent.ts`
- `lib/services/enrichment/agents/CompanyProfileAgent.ts`
- `lib/services/enrichment/agents/GeneralAgent.ts`
- `lib/services/enrichment/agents/AgentBase.ts`

**Environment Variables**:
```env
# Remove
SERP_API_KEY=xxx

# Keep
FIRECRAWL_API_KEY=xxx
GEMINI_API_KEY=xxx
```

---

### Phase 5: Testing & Validation (Day 3)

**Test Cases**:

1. **Japanese E-commerce Companies (Primary Use Case)**
   ```typescript
   Input: "日本のecommerce会社", count: 5
   Expected: BASE, STORES, カラーミーショップ, etc.
   Fields: company_name, email, employee_count, revenue
   ```

2. **Small Scale Companies**
   ```typescript
   Input: "日本のecommerce会社", specs: "スケールがあまり多くない会社", count: 5
   Expected: Smaller companies, not Amazon/Rakuten
   ```

3. **Different Industries**
   ```typescript
   Input: "日本のSaaS会社", count: 3
   Expected: freee, SmartHR, Sansan, etc.
   ```

4. **Custom Fields**
   ```typescript
   Fields: company_name, GMV, funding_amount, founder_name
   Expected: All fields extracted correctly
   ```

5. **Fallback Scenario**
   ```typescript
   Input: Very niche/new companies
   Expected: Falls back to search-based discovery
   ```

6. **Error Handling**
   ```typescript
   Scenario: Invalid website URL
   Expected: Graceful fallback, continues with other companies
   ```

**Metrics to Track**:
- API call count (target: <15 per 5 records)
- Generation time (target: <1 min per 5 records)
- Data accuracy (target: >85% correct fields)
- Cost per record (target: <$0.10)

---

## Prompt Engineering

### Company Suggestion Prompt

```typescript
const prompt = `あなたは日本のビジネスデータの専門家です。以下の条件に合う企業を${count}社提案してください。

**条件:**
- データタイプ: ${dataType}
${specifications ? `- 詳細要件: ${specifications}` : ''}

**重要な指示:**
1. 実在する企業のみを提案してください（架空の企業は不可）
2. 各企業について以下を提供してください:
   - 正式な会社名（日本語）
   - 公式ウェブサイトURL
   - 選定理由（簡潔に）
3. 条件に最も適合する企業を優先してください
4. 多様性を持たせてください（同じグループ企業を避ける）
5. 必ずJSON形式で返してください

**出力フォーマット:**
\`\`\`json
{
  "companies": [
    {
      "name": "BASE株式会社",
      "website": "https://binc.jp",
      "reasoning": "小規模事業者向けECプラットフォームを提供"
    },
    {
      "name": "STORES株式会社",
      "website": "https://stores.jp",
      "reasoning": "個人・小規模店舗向けのEC・決済サービス"
    }
  ],
  "confidence": 0.9,
  "notes": "提案した企業は全て実在し、条件に合致しています"
}
\`\`\`

重要: 必ずJSONのみを返してください。説明文は不要です。`;
```

### Unified Field Extraction Prompt

```typescript
const prompt = `あなたはビジネスデータ抽出の専門家です。以下のコンテンツから指定された全てのフィールドを一度に抽出してください。

**コンテキスト:**
- 企業名: ${context.previousResults?.company_name || '不明'}
- データタイプ: ${context.dataType}
${context.specifications ? `- 詳細要件: ${context.specifications}` : ''}

**抽出するフィールド:**
${fields.map(f => `- ${f.name} (${f.type}): ${f.description}`).join('\n')}

**コンテンツ:**
${content.substring(0, 8000)}

**重要な指示:**
1. 各フィールドについて、コンテンツから最も関連性の高い情報を抽出してください
2. 情報が見つからない場合は null を返してください（推測しないでください）
3. 各フィールドの信頼度スコア (0-1) を含めてください
4. 全体の信頼度スコアを含めてください
5. 必ず有効なJSONフォーマットで返してください
6. **全てのフィールドを一度に抽出してください**（段階的な抽出は不要）

**出力フォーマット:**
\`\`\`json
{
  ${fields.map(f => `"${f.name}": ${getExampleValue(f.type)},\n  "${f.name}_confidence": 0.8`).join(',\n  ')},
  "overall_confidence": 0.85,
  "extraction_notes": "簡潔なメモ（optional）"
}
\`\`\`

重要: 必ずJSONのみを返してください。説明文は不要です。全てのフィールドを一度に処理してください。`;
```

---

## Cost Analysis

### Current System (5 records)

| Operation | API | Count | Cost/Call | Total |
|-----------|-----|-------|-----------|-------|
| SerpAPI search | SerpAPI | 1 | $0.01 | $0.01 |
| Gemini URL filter | Gemini | 1 | $0.001 | $0.001 |
| Firecrawl scrape (discovery) | Firecrawl | 7 | $0.01 | $0.07 |
| Gemini extract (discovery) | Gemini | 1 | $0.001 | $0.001 |
| Firecrawl search (per record) | Firecrawl | 15 | $0.01 | $0.15 |
| Firecrawl scrape (per record) | Firecrawl | 15 | $0.01 | $0.15 |
| Gemini extract (per record) | Gemini | 15 | $0.001 | $0.015 |
| **Total** | | **55** | | **$0.447** |

**Per record**: $0.089

---

### New System (5 records)

| Operation | API | Count | Cost/Call | Total |
|-----------|-----|-------|-----------|-------|
| Gemini suggest companies | Gemini 2.0 | 1 | $0.001 | $0.001 |
| Firecrawl scrape (per company) | Firecrawl | 5 | $0.01 | $0.05 |
| Gemini extract all fields | Gemini 2.0 | 5 | $0.001 | $0.005 |
| **Total** | | **11** | | **$0.056** |

**Per record**: $0.011

---

### Savings

- **API calls**: 55 → 11 (80% reduction)
- **Cost**: $0.447 → $0.056 (87% reduction)
- **Per record**: $0.089 → $0.011 (88% reduction)
- **Time**: 2-3 min → 30-45 sec (4x faster)

---

## Risk Assessment

### Risk 1: Gemini Suggests Non-Existent Companies
**Probability**: Low  
**Impact**: Medium  
**Mitigation**:
- Validate by scraping suggested URL
- If scrape fails, skip and try next suggestion
- Log failed suggestions for review
- Fallback to search-based discovery

### Risk 2: Gemini's Knowledge is Outdated
**Probability**: Medium  
**Impact**: Low  
**Mitigation**:
- Scraping official website provides current data
- Contact info, employee count, revenue will be up-to-date
- Company names/websites rarely change
- This is actually an advantage over random list websites

### Risk 3: Unified Extraction Less Accurate
**Probability**: Low  
**Impact**: Medium  
**Mitigation**:
- Gemini 2.0 Flash Thinking has enhanced reasoning
- Test thoroughly before deployment
- Compare accuracy with old system
- Can revert to specialized agents if needed

### Risk 4: Gemini Can't Suggest for Niche Queries
**Probability**: Medium  
**Impact**: Low  
**Mitigation**:
- Implement fallback to search-based discovery
- Detect when Gemini returns low confidence
- Automatically switch to search mode
- Maintains current capability

### Risk 5: Model Availability/Deprecation
**Probability**: Low  
**Impact**: High  
**Mitigation**:
- `gemini-2.0-flash-thinking-exp` is experimental
- Monitor Google AI announcements
- Have fallback to stable model (`gemini-2.5-flash`)
- Architecture allows easy model switching

---

## Success Criteria

### Functional Requirements
- [ ] Generate 1-1000 records via conversation
- [ ] Company suggestions are real and relevant
- [ ] All requested fields are extracted
- [ ] Fallback to search works when needed
- [ ] Progress updates in real-time
- [ ] Errors handled gracefully

### Performance Requirements
- [ ] <15 API calls per 5 records
- [ ] <1 minute per 5 records
- [ ] <$0.02 per record
- [ ] >85% field extraction accuracy

### Quality Requirements
- [ ] Suggested companies match criteria
- [ ] Extracted data is current and accurate
- [ ] Source URLs are valid
- [ ] Confidence scores are meaningful

---

## Migration Strategy

### Option A: Hard Cutover (Recommended)
1. Complete all phases
2. Test thoroughly
3. Deploy new system
4. Remove old code

**Pros**: Clean, simple  
**Cons**: No rollback

### Option B: Feature Flag
1. Implement new system alongside old
2. Add feature flag to switch between systems
3. Test in production with small percentage
4. Gradually increase to 100%
5. Remove old code

**Pros**: Safe, gradual rollout  
**Cons**: More complex, maintains both systems temporarily

**Recommendation**: Option A (Hard Cutover)
- New system is simpler and better in every way
- Thorough testing should catch issues
- Can always revert via git if needed

---

## Timeline

### Day 1 (6-8 hours)
- Phase 1: Upgrade AI Service (2-3 hours)
- Phase 2: Create IntelligentDataAgent (4-5 hours)

### Day 2 (6-8 hours)
- Phase 3: Simplify Orchestrator (3-4 hours)
- Phase 4: Remove Deprecated Code (2-3 hours)
- Initial testing (1-2 hours)

### Day 3 (4-6 hours)
- Phase 5: Comprehensive Testing (3-4 hours)
- Documentation updates (1-2 hours)

**Total**: 16-22 hours (2-3 days)

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Approve architecture changes**
3. **Begin Phase 1** (Upgrade AI Service)
4. **Test company suggestions** with real queries
5. **Proceed with implementation**

---

**Document Status**: ✅ Planning Complete - Ready for Implementation  
**Estimated Effort**: 2-3 days  
**Expected Savings**: 87% cost reduction, 4x speed improvement  
**Risk Level**: Low (with proper testing)
