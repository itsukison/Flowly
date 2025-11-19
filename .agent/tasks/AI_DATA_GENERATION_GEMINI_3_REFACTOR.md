# AI Data Generation - Gemini 3 Pro Hybrid Architecture

**Status**: Planning Phase  
**Created**: 2024-11-19  
**Model**: `gemini-3-pro-preview` (Knowledge Cutoff: January 2025)  
**Objective**: Hybrid approach using Gemini 3's knowledge + targeted web enrichment

---

## Executive Summary

### The Hybrid Approach

**Phase 1: Instant Knowledge Extraction (5-10 seconds)**
- Gemini 3 Pro generates companies with ALL fields
- Provides high-confidence data instantly (no scraping)
- Marks low-confidence fields for enrichment

**Phase 2: Targeted Enrichment (20-40 seconds)**
- Only scrape for fields Gemini 3 is uncertain about
- Use Gemini 3's built-in URL Context tool (10x cheaper than Firecrawl)
- Real-time progress: "Enriching BASE株式会社: email, employee_count..."

### Why This Works

**Gemini 3 Pro Advantages:**
- **Recent knowledge cutoff** (January 2025) - knows most companies
- **Built-in URL Context** - can fetch and analyze websites directly
- **Enhanced reasoning** - better field extraction with thinking
- **Confidence scoring** - knows what it knows vs. doesn't know

**User Experience:**
- Instant partial results (no waiting for scraping)
- Progressive enrichment with real-time updates
- See which fields are being enriched
- Feels much faster than current system

### Expected Improvements

| Metric | Current | New | Improvement |
|--------|---------|-----|-------------|
| **Time** | 2-3 min | 25-50 sec | 3-4x faster |
| **Cost** | $0.45 | $0.01-0.02 | 95% reduction |
| **API Calls** | 70 | 6-11 | 85-91% reduction |
| **UX** | Spinner | Real-time progress | Much better |
| **Agents** | 4 specialized | 2 unified | Simpler |

---

## Architecture Design

### Current System (Complex & Slow)

```
User Request
  ↓
CompanyDiscoveryAgent
  ├─ SerpAPI search (10s)
  ├─ Gemini filter (2s)
  ├─ Firecrawl scrape × 7 (70s)
  └─ Extract companies (3s)
  ↓
For each of 5 records:
  ├─ ContactInfoAgent (15s)
  ├─ CompanyProfileAgent (15s)
  └─ GeneralAgent (10s)
  
Total: 2-3 minutes, 70 API calls, $0.45
```

### New System (Fast & Efficient)

```
User Request
  ↓
Phase 1: Knowledge Extraction (5-10s)
  Gemini3KnowledgeAgent
    └─ Gemini 3 Pro (thinking_level: high)
       → Generates 5 companies with ALL fields
       → Marks confidence for each field
       → Returns partial data INSTANTLY
  
  Result:
    Company 1: BASE株式会社
      ✓ company_name (0.95)
      ✓ website (0.90)
      ✓ industry (0.85)
      ✗ email (0.30) ← Need enrichment
      ✗ employee_count (0.40) ← Need enrichment
  ↓
Phase 2: Targeted Enrichment (20-40s)
  For each company with low-confidence fields:
    Gemini3EnrichmentAgent
      └─ Gemini 3 Pro (thinking_level: low, tools: [url_context])
         → Fetches company website
         → Extracts ONLY missing fields
         → Real-time progress updates
      
      Fallback: Firecrawl if URL Context fails
  
Total: 25-50 seconds, 6-11 API calls, $0.01-0.02
```

---

## Detailed Component Design

### 1. Gemini3Service (New)

**Purpose**: Unified service for Gemini 3 Pro interactions

**Location**: `Flowly/lib/services/enrichment/Gemini3Service.ts`

**Configuration**:
```typescript
class Gemini3Service {
  private model: GenerativeModel;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-pro-preview',
      generationConfig: {
        temperature: 1.0, // Keep at default for Gemini 3
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }
}
```

**Key Methods**:

```typescript
/**
 * Generate companies with ALL fields and confidence scores
 * Uses thinking_level: "high" for better reasoning
 */
async generateCompaniesWithConfidence(
  dataType: string,
  specifications: string | undefined,
  count: number,
  fields: EnrichmentField[]
): Promise<CompanyWithConfidence[]>

/**
 * Enrich missing fields using URL Context tool
 * Uses thinking_level: "low" for faster extraction
 */
async enrichMissingFields(
  companyName: string,
  websiteUrl: string,
  missingFields: EnrichmentField[]
): Promise<ExtractedData>

/**
 * Fallback: Extract fields from Firecrawl content
 */
async extractFieldsFromContent(
  content: string,
  fields: EnrichmentField[]
): Promise<ExtractedData>
```

---

### 2. Gemini3KnowledgeAgent (New)

**Purpose**: Generate companies with partial data using Gemini 3's knowledge

**Location**: `Flowly/lib/services/enrichment/agents/Gemini3KnowledgeAgent.ts`

**Key Method**:

```typescript
async execute(
  dataType: string,
  specifications: string | undefined,
  count: number,
  fields: EnrichmentField[],
  onProgress?: ProgressCallback
): Promise<CompanyWithConfidence[]> {
  
  onProgress?.('Analyzing requirements...', 'info');
  onProgress?.('Generating company suggestions using AI knowledge...', 'info');
  
  // Call Gemini 3 with thinking_level: high
  const companies = await this.gemini3.generateCompaniesWithConfidence(
    dataType,
    specifications,
    count,
    fields
  );
  
  onProgress?.(`Found ${companies.length} companies matching criteria`, 'success');
  
  // Log confidence breakdown
  for (const company of companies) {
    const highConfFields = company.fields.filter(f => f.confidence >= 0.80).length;
    const totalFields = company.fields.length;
    onProgress?.(
      `${company.name}: ${highConfFields}/${totalFields} fields with high confidence`,
      'info'
    );
  }
  
  return companies;
}
```

**Output Format**:
```typescript
interface CompanyWithConfidence {
  name: string;
  website: string;
  fields: Array<{
    name: string;
    value: any;
    confidence: number; // 0-1
  }>;
}
```

---

### 3. Gemini3EnrichmentAgent (New)

**Purpose**: Enrich low-confidence fields using URL Context or Firecrawl

**Location**: `Flowly/lib/services/enrichment/agents/Gemini3EnrichmentAgent.ts`

**Key Method**:

```typescript
async execute(
  company: CompanyWithConfidence,
  onProgress?: ProgressCallback
): Promise<EnrichedCompany> {
  
  // Get fields that need enrichment (confidence < 0.80)
  const missingFields = company.fields
    .filter(f => f.confidence < 0.80)
    .map(f => ({ name: f.name, ... }));
  
  if (missingFields.length === 0) {
    onProgress?.(`${company.name}: No enrichment needed`, 'success');
    return company;
  }
  
  onProgress?.(
    `Enriching ${company.name}: ${missingFields.map(f => f.name).join(', ')}`,
    'info'
  );
  
  try {
    // Primary: Use Gemini 3's URL Context tool
    onProgress?.(`Fetching ${company.website}...`, 'info');
    
    const enriched = await this.gemini3.enrichMissingFields(
      company.name,
      company.website,
      missingFields
    );
    
    // Update fields with enriched data
    for (const field of missingFields) {
      if (enriched.data[field.name]) {
        onProgress?.(`Extracted ${field.name} ✓`, 'success');
      }
    }
    
    return { ...company, fields: mergeFields(company.fields, enriched) };
    
  } catch (error) {
    // Fallback: Use Firecrawl
    onProgress?.(`URL Context failed, using Firecrawl fallback...`, 'warning');
    
    const scraped = await this.firecrawl.scrape({
      url: company.website,
      formats: ['markdown'],
      onlyMainContent: true,
    });
    
    const enriched = await this.gemini3.extractFieldsFromContent(
      scraped.markdown,
      missingFields
    );
    
    return { ...company, fields: mergeFields(company.fields, enriched) };
  }
}
```

---

## Prompt Engineering for Gemini 3

### Knowledge Extraction Prompt (thinking_level: high)

```typescript
const prompt = `あなたは日本のビジネスデータの専門家です。以下の条件に合う企業を${count}社提案し、各企業について全てのフィールドを埋めてください。

**重要: 確信度が高い情報のみを提供してください。不確かな情報は null にしてください。**

**条件:**
- データタイプ: ${dataType}
${specifications ? `- 詳細要件: ${specifications}` : ''}

**抽出するフィールド:**
${fields.map(f => `- ${f.name} (${f.type}): ${f.description}`).join('\n')}

**指示:**
1. 実在する企業のみを提案してください
2. 各フィールドについて、あなたの知識に基づいて値を提供してください
3. **確信度が80%未満の場合は null を返してください**
4. 各フィールドに confidence スコア (0-1) を付けてください
5. 必ずJSON形式で返してください

**出力フォーマット:**
\`\`\`json
{
  "companies": [
    {
      "name": "BASE株式会社",
      "website": "https://binc.jp",
      "fields": {
        "company_name": { "value": "BASE株式会社", "confidence": 0.95 },
        "website": { "value": "https://binc.jp", "confidence": 0.90 },
        "industry": { "value": "Eコマースプラットフォーム", "confidence": 0.85 },
        "email": { "value": null, "confidence": 0.30 },
        "employee_count": { "value": null, "confidence": 0.40 },
        "revenue": { "value": null, "confidence": 0.20 }
      }
    }
  ],
  "reasoning": "選定理由と確信度の根拠"
}
\`\`\`

重要: 
- 確信度 >= 0.80 の情報のみ値を提供
- 確信度 < 0.80 の場合は null を返す
- 推測や憶測は避ける`;
```

### Field Enrichment Prompt (thinking_level: low, with URL Context)

```typescript
const prompt = `以下の企業について、指定されたフィールドの情報を公式ウェブサイトから抽出してください。

**企業情報:**
- 企業名: ${companyName}
- ウェブサイト: ${websiteUrl}

**抽出するフィールド:**
${missingFields.map(f => `- ${f.name} (${f.type}): ${f.description}`).join('\n')}

**指示:**
1. 公式ウェブサイトから最新の情報を取得してください
2. 各フィールドについて、見つかった情報を抽出してください
3. 情報が見つからない場合は null を返してください
4. 必ずJSON形式で返してください

**出力フォーマット:**
\`\`\`json
{
  ${missingFields.map(f => `"${f.name}": "値またはnull"`).join(',\n  ')},
  "sources": {
    ${missingFields.map(f => `"${f.name}": "情報源のURL"`).join(',\n    ')}
  }
}
\`\`\`

重要: ウェブサイトから確認できた情報のみを返してください。`;
```

---

## Real-Time Progress Display

### Progress Message Types

```typescript
type ProgressStage = 
  | 'knowledge_extraction'
  | 'enrichment'
  | 'complete';

type ProgressMessage = {
  stage: ProgressStage;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  company?: string;
  field?: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
};
```

### Progress Flow Example

```typescript
// Stage 1: Knowledge Extraction (5-10 seconds)
{
  stage: 'knowledge_extraction',
  message: 'Analyzing requirements...',
  type: 'info',
  progress: { current: 0, total: 5, percentage: 0 }
}

{
  stage: 'knowledge_extraction',
  message: 'Generating company suggestions using AI knowledge...',
  type: 'info',
  progress: { current: 0, total: 5, percentage: 10 }
}

{
  stage: 'knowledge_extraction',
  message: 'Found 5 companies matching criteria',
  type: 'success',
  progress: { current: 5, total: 5, percentage: 20 }
}

{
  stage: 'knowledge_extraction',
  message: 'BASE株式会社: 3/6 fields with high confidence',
  type: 'info',
  company: 'BASE株式会社',
  progress: { current: 1, total: 5, percentage: 25 }
}

// Stage 2: Enrichment (20-40 seconds)
{
  stage: 'enrichment',
  message: 'Enriching BASE株式会社: email, employee_count, revenue',
  type: 'info',
  company: 'BASE株式会社',
  progress: { current: 1, total: 5, percentage: 30 }
}

{
  stage: 'enrichment',
  message: 'Fetching https://binc.jp...',
  type: 'info',
  company: 'BASE株式会社',
  progress: { current: 1, total: 5, percentage: 35 }
}

{
  stage: 'enrichment',
  message: 'Extracted email ✓',
  type: 'success',
  company: 'BASE株式会社',
  field: 'email',
  progress: { current: 1, total: 5, percentage: 40 }
}

{
  stage: 'enrichment',
  message: 'Extracted employee_count ✓',
  type: 'success',
  company: 'BASE株式会社',
  field: 'employee_count',
  progress: { current: 1, total: 5, percentage: 45 }
}

{
  stage: 'enrichment',
  message: 'Extracted revenue ✓',
  type: 'success',
  company: 'BASE株式会社',
  field: 'revenue',
  progress: { current: 1, total: 5, percentage: 50 }
}

// ... repeat for other companies ...

{
  stage: 'complete',
  message: 'Generation complete: 5/5 companies enriched',
  type: 'success',
  progress: { current: 5, total: 5, percentage: 100 }
}
```

### UI Implementation

```typescript
// In AIEnrichmentModal.tsx
const [progressMessages, setProgressMessages] = useState<ProgressMessage[]>([]);

// SSE connection
const eventSource = new EventSource(`/api/enrichment/progress/${sessionId}`);

eventSource.onmessage = (event) => {
  const message: ProgressMessage = JSON.parse(event.data);
  setProgressMessages(prev => [...prev, message]);
};

// Display
<div className="progress-container">
  <ProgressBar percentage={latestMessage.progress.percentage} />
  
  <div className="progress-log">
    {progressMessages.map((msg, i) => (
      <div key={i} className={`progress-item ${msg.type}`}>
        {msg.company && <span className="company-badge">{msg.company}</span>}
        {msg.field && <span className="field-badge">{msg.field}</span>}
        <span className="message">{msg.message}</span>
      </div>
    ))}
  </div>
</div>
```

---

## Field Confidence Strategy

### High-Confidence Fields (Gemini 3 Knowledge)

**Static/Stable Information** (confidence >= 0.80):
- ✓ `company_name` - Company names rarely change
- ✓ `website` - Official URLs are stable
- ✓ `industry` - Business sector classification
- ✓ `description` - What the company does
- ✓ `founded_year` - Establishment date
- ✓ `headquarters_location` - Main office location
- ✓ `business_model` - B2B, B2C, etc.
- ✓ `parent_company` - Corporate structure

### Low-Confidence Fields (Need Enrichment)

**Dynamic/Current Information** (confidence < 0.80):
- ✗ `email` - Changes frequently, not in training data
- ✗ `phone` - Changes frequently
- ✗ `employee_count` - Dynamic, changes quarterly
- ✗ `revenue` - Dynamic, changes annually
- ✗ `gmv` - Dynamic, not public for all companies
- ✗ `funding_amount` - Recent rounds not in training
- ✗ `latest_funding_round` - Too recent
- ✗ `contact_person` - Too specific, changes
- ✗ `office_address` - May have moved

### Confidence Threshold

```typescript
const CONFIDENCE_THRESHOLD = 0.80;

function needsEnrichment(field: FieldWithConfidence): boolean {
  return field.confidence < CONFIDENCE_THRESHOLD || field.value === null;
}
```

### Example Output

```json
{
  "companies": [
    {
      "name": "BASE株式会社",
      "website": "https://binc.jp",
      "fields": {
        "company_name": { "value": "BASE株式会社", "confidence": 0.95 },
        "website": { "value": "https://binc.jp", "confidence": 0.90 },
        "industry": { "value": "Eコマースプラットフォーム", "confidence": 0.85 },
        "founded_year": { "value": 2012, "confidence": 0.90 },
        "headquarters": { "value": "東京都港区", "confidence": 0.85 },
        "email": { "value": null, "confidence": 0.30 },
        "employee_count": { "value": null, "confidence": 0.40 },
        "revenue": { "value": null, "confidence": 0.20 }
      }
    }
  ]
}
```

**Result**: 5/8 fields provided instantly, 3/8 need enrichment

---

## Cost Analysis

### Scenario: 5 Japanese E-commerce Companies, 8 Fields Each

#### Current System

| Operation | API | Count | Cost/Call | Total |
|-----------|-----|-------|-----------|-------|
| SerpAPI search | SerpAPI | 1 | $0.01 | $0.01 |
| Gemini filter | Gemini 2.5 | 1 | $0.001 | $0.001 |
| Firecrawl scrape (discovery) | Firecrawl | 7 | $0.01 | $0.07 |
| Gemini extract (discovery) | Gemini 2.5 | 1 | $0.001 | $0.001 |
| Firecrawl search (per record) | Firecrawl | 15 | $0.01 | $0.15 |
| Firecrawl scrape (per record) | Firecrawl | 15 | $0.01 | $0.15 |
| Gemini extract (per record) | Gemini 2.5 | 15 | $0.001 | $0.015 |
| **Total** | | **55** | | **$0.447** |

**Per record**: $0.089

---

#### New System (Gemini 3 Hybrid)

**Assumption**: Gemini 3 provides 5/8 fields with high confidence

| Operation | API | Count | Cost/Call | Total |
|-----------|-----|-------|-----------|-------|
| Knowledge extraction | Gemini 3 | 1 | $0.002 | $0.002 |
| URL Context enrichment | Gemini 3 | 5 | $0.002 | $0.010 |
| **Total** | | **6** | | **$0.012** |

**Per record**: $0.0024

---

#### New System (with Firecrawl Fallback)

**Assumption**: URL Context fails for 2/5 companies

| Operation | API | Count | Cost/Call | Total |
|-----------|-----|-------|-----------|-------|
| Knowledge extraction | Gemini 3 | 1 | $0.002 | $0.002 |
| URL Context enrichment | Gemini 3 | 3 | $0.002 | $0.006 |
| Firecrawl scrape (fallback) | Firecrawl | 2 | $0.01 | $0.020 |
| Gemini 3 extract (fallback) | Gemini 3 | 2 | $0.002 | $0.004 |
| **Total** | | **8** | | **$0.032** |

**Per record**: $0.0064

---

### Savings Summary

| Scenario | Cost | vs Current | Savings |
|----------|------|------------|---------|
| **Current System** | $0.447 | - | - |
| **New (URL Context only)** | $0.012 | -97% | $0.435 |
| **New (with Firecrawl fallback)** | $0.032 | -93% | $0.415 |

**Even with fallback, we save 93% on costs!**

---

## Implementation Plan

### Phase 1: Gemini 3 Service (Day 1 - 4 hours) ✅ COMPLETE

**Tasks**:
- [x] Create `Gemini3Service.ts`
- [x] Implement `generateCompaniesWithConfidence()`
- [x] Implement `enrichMissingFields()` with URL Context
- [x] Implement `extractFieldsFromContent()` (fallback)
- [ ] Test knowledge extraction quality
- [ ] Test URL Context tool
- [ ] Test confidence scoring accuracy

**Files Created**:
- `lib/services/enrichment/Gemini3Service.ts`

**Testing**:
```typescript
// Test 1: Knowledge extraction
const companies = await gemini3.generateCompaniesWithConfidence(
  "日本のecommerce会社",
  "スケールがあまり多くない会社",
  5,
  fields
);
console.log('High-confidence fields:', 
  companies[0].fields.filter(f => f.confidence >= 0.80).length
);

// Test 2: URL Context enrichment
const enriched = await gemini3.enrichMissingFields(
  "BASE株式会社",
  "https://binc.jp",
  [{ name: "email", ... }, { name: "employee_count", ... }]
);
console.log('Enriched data:', enriched);
```

---

### Phase 2: Agent Implementation (Day 1-2 - 6 hours) ✅ COMPLETE

**Tasks**:
- [x] Create `Gemini3KnowledgeAgent.ts`
- [x] Create `Gemini3EnrichmentAgent.ts`
- [x] Implement progress callbacks
- [x] Add error handling
- [x] Add Firecrawl fallback logic
- [ ] Write unit tests

**Files Created**:
- `lib/services/enrichment/agents/Gemini3KnowledgeAgent.ts`
- `lib/services/enrichment/agents/Gemini3EnrichmentAgent.ts`

**Key Features**:
- Real-time progress updates
- Confidence threshold filtering
- Graceful fallback to Firecrawl
- Detailed logging

---

### Phase 3: Orchestrator Refactoring (Day 2 - 4 hours) ✅ COMPLETE

**Tasks**:
- [x] Simplify `DataGenerationOrchestrator.ts`
- [x] Implement 2-phase generation flow
- [x] Remove SerpAPI dependency
- [ ] Add SSE progress streaming
- [ ] Update database schema for confidence scores
- [ ] Test end-to-end flow

**Files Modified**:
- `lib/services/enrichment/DataGenerationOrchestrator.ts`
- `app/api/enrichment/generate/route.ts`

**New Flow**:
```typescript
async generateRecordsBatch(
  count: number,
  dataType: string,
  specifications: string | undefined,
  fields: EnrichmentField[],
  onProgress?: ProgressCallback
): Promise<GeneratedRecord[]> {
  
  // Phase 1: Knowledge Extraction (instant)
  const companies = await this.knowledgeAgent.execute(
    dataType,
    specifications,
    count,
    fields,
    onProgress
  );
  
  // Phase 2: Targeted Enrichment (only for low-confidence fields)
  const enrichedCompanies = [];
  for (const company of companies) {
    const enriched = await this.enrichmentAgent.execute(
      company,
      onProgress
    );
    enrichedCompanies.push(enriched);
  }
  
  return enrichedCompanies;
}
```

---

### Phase 4: Remove Deprecated Code (Day 2 - 2 hours) ✅ COMPLETE

**Tasks**:
- [x] Delete `SerpAPIService.ts`
- [x] Delete `GeminiURLSelector.ts`
- [x] Delete `AISynthesisService.ts`
- [x] Delete `AgentOrchestrator.ts`
- [x] Delete old agent files (4 agents + AgentBase)
- [ ] Remove SerpAPI from package.json (if exists)
- [ ] Update environment variables docs
- [x] Update types.ts

**Files Deleted**:
- `lib/services/enrichment/SerpAPIService.ts`
- `lib/services/enrichment/GeminiURLSelector.ts`
- `lib/services/enrichment/AISynthesisService.ts`
- `lib/services/enrichment/AgentOrchestrator.ts`
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
FIRECRAWL_API_KEY=xxx (fallback only)
GEMINI_API_KEY=xxx (upgrade to Gemini 3)
```

---

### Phase 5: UI Enhancement (Day 3 - 4 hours) ✅ COMPLETE

**Tasks**:
- [x] Update `AIEnrichmentModal.tsx` for real-time progress
- [x] Show table immediately with empty cells
- [x] Add shadcn Checkbox for row status
- [x] Display "未取得" (not found) for empty cells
- [x] Show loading spinners for cells being filled
- [x] Add split view: Table + Progress Log
- [x] Add stage indicators (Knowledge → Enrichment → Complete)
- [x] Add smooth animations for cell updates
- [x] Auto-scroll progress log

**Files Modified**:
- `components/tables/modals/AIEnrichmentModal.tsx`

**UI Features Implemented**:
- ✅ Instant table display with all rows/columns
- ✅ Shadcn Checkbox for completed rows
- ✅ Real-time cell updates with fade-in animation
- ✅ "未取得" / "生成中..." / "取得中..." status per cell
- ✅ Split view: Live table (left) + Progress log (right)
- ✅ Stage indicator with animated dot
- ✅ Row highlighting when complete (green tint)
- ✅ Responsive polling (1.5s intervals)

---

### Phase 6: Testing & Validation (Day 3 - 4 hours)

**Test Cases**:

1. **Japanese E-commerce (Primary)**
   ```typescript
   Input: "日本のecommerce会社", count: 5
   Fields: company_name, website, email, employee_count, revenue
   Expected: 3/5 fields instant, 2/5 enriched
   ```

2. **Small Scale Companies**
   ```typescript
   Input: "スケールがあまり多くない会社", count: 5
   Expected: Smaller companies, not giants
   ```

3. **High-Confidence Fields Only**
   ```typescript
   Fields: company_name, website, industry, founded_year
   Expected: All fields instant, no enrichment needed
   ```

4. **Low-Confidence Fields Only**
   ```typescript
   Fields: email, phone, employee_count, revenue
   Expected: All fields need enrichment
   ```

5. **URL Context Failure**
   ```typescript
   Scenario: URL Context rate limited
   Expected: Graceful fallback to Firecrawl
   ```

6. **Mixed Confidence**
   ```typescript
   Fields: company_name, website, email, revenue, GMV
   Expected: 2 instant, 3 enriched
   ```

**Metrics to Track**:
- Knowledge extraction time (<10s)
- Enrichment time per company (<10s)
- Total time for 5 records (<50s)
- Cost per 5 records (<$0.05)
- Field accuracy (>90%)
- Confidence score accuracy (>85%)

---

## Gemini 3 Specific Features

### 1. Thinking Levels

**High Thinking** (Knowledge Extraction):
```typescript
const response = await client.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: prompt,
  config: {
    thinking_level: "high", // Maximize reasoning depth
  },
});
```

**Low Thinking** (Field Enrichment):
```typescript
const response = await client.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: prompt,
  config: {
    thinking_level: "low", // Minimize latency
  },
});
```

---

### 2. URL Context Tool

**Built-in URL fetching** (no Firecrawl needed):
```typescript
const response = await client.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: `Extract email and employee count from ${websiteUrl}`,
  config: {
    tools: [
      { url_context: {} } // Built-in URL fetching
    ],
  },
});
```

**Benefits**:
- 10x cheaper than Firecrawl
- No rate limiting (within Gemini's limits)
- Integrated with Gemini's reasoning
- Automatic content extraction

---

### 3. Structured Outputs with Tools

**Combine URL Context with JSON Schema**:
```typescript
const response = await client.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: `Extract contact info from ${websiteUrl}`,
  config: {
    tools: [
      { url_context: {} }
    ],
    response_mime_type: "application/json",
    response_json_schema: {
      type: "object",
      properties: {
        email: { type: "string" },
        phone: { type: "string" },
        employee_count: { type: "number" }
      }
    },
  },
});
```

**Benefits**:
- Type-safe responses
- No JSON parsing errors
- Automatic validation
- Cleaner code

---

### 4. Temperature Settings

**Keep at default 1.0**:
```typescript
// ✓ Correct
generationConfig: {
  temperature: 1.0, // Default for Gemini 3
}

// ✗ Avoid
generationConfig: {
  temperature: 0.3, // May cause looping or degraded performance
}
```

**Why**: Gemini 3's reasoning is optimized for temperature 1.0

---

### 5. Thought Signatures

**Automatic handling with official SDKs**:
```typescript
// Using official SDK - signatures handled automatically
const chat = model.startChat({
  history: previousMessages, // Signatures preserved
});

const result = await chat.sendMessage(newMessage);
```

**Manual handling** (if needed):
```typescript
// If migrating from other models
const signature = "context_engineering_is_the_way_to_go"; // Dummy signature
```

---

## Database Schema Updates

### Add Confidence Scores

```sql
-- Update ai_generated_records table
ALTER TABLE ai_generated_records
ADD COLUMN field_confidence JSONB;

-- Example data
{
  "company_name": 0.95,
  "website": 0.90,
  "industry": 0.85,
  "email": 0.95,
  "employee_count": 0.80,
  "revenue": 0.75
}
```

### Add Enrichment Tracking

```sql
-- Track which fields were enriched
ALTER TABLE ai_generated_records
ADD COLUMN enriched_fields TEXT[],
ADD COLUMN enrichment_method TEXT; -- 'knowledge', 'url_context', 'firecrawl'

-- Example
enriched_fields: ['email', 'employee_count', 'revenue']
enrichment_method: 'url_context'
```

---

## Risk Assessment

### Risk 1: Gemini 3 Overconfidence
**Probability**: Medium  
**Impact**: Medium  
**Mitigation**:
- Set confidence threshold at 0.80 (conservative)
- Always enrich critical fields (email, phone)
- Validate against scraped data when available
- User can manually verify/edit data

### Risk 2: URL Context Rate Limits
**Probability**: Low  
**Impact**: Low  
**Mitigation**:
- Implement Firecrawl fallback
- Track URL Context usage
- Add exponential backoff
- Cache successful fetches

### Risk 3: Knowledge Cutoff Limitations
**Probability**: Medium  
**Impact**: Low  
**Mitigation**:
- January 2025 cutoff is very recent
- Enrichment phase gets current data
- Use Google Search tool for very recent companies
- Clear messaging about data freshness

### Risk 4: Cost Overruns
**Probability**: Low  
**Impact**: Low  
**Mitigation**:
- Gemini 3 is cheaper than current system
- URL Context is 10x cheaper than Firecrawl
- Monitor usage with alerts
- Set daily/monthly limits

### Risk 5: Structured Output Failures
**Probability**: Low  
**Impact**: Low  
**Mitigation**:
- Use Zod for validation
- Fallback to text parsing
- Retry with adjusted schema
- Log failures for debugging

---

## Success Criteria

### Functional Requirements
- [ ] Generate 1-1000 records via conversation
- [ ] Instant partial results (Phase 1)
- [ ] Progressive enrichment (Phase 2)
- [ ] Real-time progress updates
- [ ] Confidence scores for all fields
- [ ] Graceful fallback to Firecrawl
- [ ] Error handling and recovery

### Performance Requirements
- [ ] Phase 1: <10 seconds (knowledge extraction)
- [ ] Phase 2: <10 seconds per company (enrichment)
- [ ] Total: <50 seconds for 5 records
- [ ] <$0.05 per 5 records
- [ ] >90% field accuracy

### Quality Requirements
- [ ] Confidence scores are accurate (±10%)
- [ ] High-confidence fields are correct (>95%)
- [ ] Enriched fields are current and accurate
- [ ] Source URLs are valid
- [ ] No hallucinated data

### UX Requirements
- [ ] Progress updates every 2-3 seconds
- [ ] Clear stage indicators
- [ ] Company/field badges
- [ ] Smooth animations
- [ ] Error messages are helpful

---

## Migration Strategy

### Option A: Hard Cutover (Recommended)

**Steps**:
1. Complete all phases (Days 1-3)
2. Test thoroughly with real data
3. Deploy to production
4. Monitor for 24 hours
5. Remove old code

**Pros**: Clean, simple, no maintenance burden  
**Cons**: No rollback (but can revert via git)

---

### Option B: Feature Flag

**Steps**:
1. Implement new system alongside old
2. Add feature flag: `USE_GEMINI_3_HYBRID`
3. Test with 10% of users
4. Gradually increase to 100%
5. Remove old code after 1 week

**Pros**: Safe, gradual rollout, easy rollback  
**Cons**: More complex, maintains both systems

---

**Recommendation**: Option A (Hard Cutover)
- New system is objectively better
- Thorough testing should catch issues
- Can always revert via git if needed
- Simpler implementation

---

## Timeline

### Day 1 (8 hours)
- **Morning** (4h): Phase 1 - Gemini 3 Service
- **Afternoon** (4h): Phase 2 - Agent Implementation (start)

### Day 2 (8 hours)
- **Morning** (2h): Phase 2 - Agent Implementation (finish)
- **Midday** (4h): Phase 3 - Orchestrator Refactoring
- **Afternoon** (2h): Phase 4 - Remove Deprecated Code

### Day 3 (8 hours)
- **Morning** (4h): Phase 5 - UI Enhancement
- **Afternoon** (4h): Phase 6 - Testing & Validation

**Total**: 24 hours (3 days)

---

## Next Steps

1. ✅ **Review this plan** with stakeholders
2. ⏳ **Approve architecture** and timeline
3. ⏳ **Set up Gemini 3 API access** (if not already)
4. ⏳ **Begin Phase 1** (Gemini 3 Service)
5. ⏳ **Test knowledge extraction** with real queries
6. ⏳ **Proceed with implementation**

---

## Appendix: Example Flow

### User Request
```
"日本のecommerce会社を5個拾ってきて欲しい。スケールがあまり多くない会社で、連絡先と従業員数と売り上げを知りたい"
```

### Phase 1: Knowledge Extraction (8 seconds)

**Gemini 3 Response**:
```json
{
  "companies": [
    {
      "name": "BASE株式会社",
      "website": "https://binc.jp",
      "fields": {
        "company_name": { "value": "BASE株式会社", "confidence": 0.95 },
        "website": { "value": "https://binc.jp", "confidence": 0.90 },
        "email": { "value": null, "confidence": 0.30 },
        "employee_count": { "value": null, "confidence": 0.40 },
        "revenue": { "value": null, "confidence": 0.25 }
      }
    },
    {
      "name": "STORES株式会社",
      "website": "https://stores.jp",
      "fields": {
        "company_name": { "value": "STORES株式会社", "confidence": 0.95 },
        "website": { "value": "https://stores.jp", "confidence": 0.90 },
        "email": { "value": null, "confidence": 0.30 },
        "employee_count": { "value": null, "confidence": 0.35 },
        "revenue": { "value": null, "confidence": 0.20 }
      }
    }
    // ... 3 more companies
  ]
}
```

**User sees immediately**:
- 5 companies with names and websites
- 2/5 fields complete, 3/5 pending enrichment

---

### Phase 2: Enrichment (40 seconds)

**Company 1: BASE株式会社** (8 seconds)
```
Progress: "Enriching BASE株式会社: email, employee_count, revenue"
Progress: "Fetching https://binc.jp..."
Progress: "Extracted email ✓"
Progress: "Extracted employee_count ✓"
Progress: "Extracted revenue ✓"
```

**Company 2: STORES株式会社** (8 seconds)
```
Progress: "Enriching STORES株式会社: email, employee_count, revenue"
Progress: "Fetching https://stores.jp..."
Progress: "Extracted email ✓"
Progress: "Extracted employee_count ✓"
Progress: "Extracted revenue ✓"
```

**... repeat for 3 more companies ...**

---

### Final Result (48 seconds total)

```json
[
  {
    "company_name": "BASE株式会社",
    "website": "https://binc.jp",
    "email": "info@binc.jp",
    "employee_count": 150,
    "revenue": "非公開",
    "sources": [
      { "field": "company_name", "source": "gemini_knowledge", "confidence": 0.95 },
      { "field": "website", "source": "gemini_knowledge", "confidence": 0.90 },
      { "field": "email", "source": "url_context", "url": "https://binc.jp/company", "confidence": 0.95 },
      { "field": "employee_count", "source": "url_context", "url": "https://binc.jp/company", "confidence": 0.85 },
      { "field": "revenue", "source": "url_context", "url": "https://binc.jp/company", "confidence": 0.70 }
    ]
  }
  // ... 4 more companies
]
```

**Cost**: $0.012 (6 API calls)  
**Time**: 48 seconds  
**Accuracy**: 95%+ for high-confidence fields

---

**Document Status**: ✅ Core Implementation Complete - Ready for Testing  
**Implementation Date**: 2024-11-19  
**Phases Complete**: 1-4 (Service, Agents, Orchestrator, Cleanup)  
**Remaining**: Phase 5 (UI), Phase 6 (Testing)  
**Expected Savings**: 93-97% cost reduction, 3-4x speed improvement  
**Test Script**: `scripts/test-gemini3-generation.ts`
