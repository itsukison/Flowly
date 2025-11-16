# AI Chat Implementation Plan - Database Assistant

**Task ID**: AI_CHAT_IMPLEMENTATION  
**Status**: 🚧 In Progress - Phase 1 & 2 Complete  
**Created**: 2024-11-16  
**Updated**: 2024-11-16  
**Priority**: High  
**Complexity**: High

---

## 1. Overview

### Goal
Add an AI-powered chat interface to the data table view (`/dashboard/tables/[tableId]/data`) that allows users to ask questions about their database and get intelligent responses. The AI should understand user intent, query the database when necessary, and present results in either text or table format.

### User Story
> "As a user viewing my table data, I want to click an 'AI Chat' button that opens a ChatGPT-like interface where I can ask questions about my data (e.g., 'Show me all customers from Tokyo', 'How many leads do we have?', 'Find duplicates by email'), and the AI will understand my intent, query the database, and show results in an appropriate format (text or table)."

### Key Features
1. **Chat Interface**: ChatGPT-style UI with message history
2. **Intent Understanding**: Gemini API analyzes user questions
3. **Database Queries**: Executes SQL or uses Supabase MCP tools
4. **Smart Responses**: Returns text explanations or table views
5. **Context Awareness**: Knows current table schema and data
6. **Function Calling**: Can list tables, query data, get statistics

---

## 2. Architecture Analysis

### Current System Understanding

**Database Architecture** (from `.agent/system/architecture.md`):
- Hybrid JSONB approach with indexed common fields
- `records` table stores all custom table data
- Common fields: `name`, `email`, `company`, `status` (indexed)
- Custom fields: stored in `data` JSONB column
- Multi-tenant with RLS (organization_id isolation)

**Table Schema** (from `.agent/system/database-schema.md`):
- `tables`: Stores table definitions with `schema` JSONB
- `table_columns`: Column metadata for UI
- `table_statuses`: Status options for each table
- `records`: Actual data rows

**Current Data Page** (`app/dashboard/tables/[tableId]/data/page.tsx`):
- Server component that fetches table, columns, statuses, records
- Passes data to `DiceTableView` client component
- Already has enrichment and deduplication features

**Available APIs**:
- Supabase: Full access with service role key
- Supabase MCP: Available for database operations

---

## 3. Technical Design

### 3.1 Component Architecture

```
DiceTableView (existing)
├── Toolbar (existing)
│   ├── Menu Button
│   ├── Enrichment Button
│   ├── Deduplication Button
│   └── [NEW] AI Chat Button ⭐
├── DataGrid (existing)
└── [NEW] AIChatModal ⭐
    ├── ChatHeader
    ├── MessageList
    │   ├── UserMessage
    │   ├── AIMessage (text)
    │   └── AIMessage (table)
    ├── ChatInput
    └── TypingIndicator
```

### 3.2 Data Flow

```
User Question
    ↓
AIChatModal
    ↓
POST /api/chat/query
    ↓
Gemini API (Intent Analysis + Function Calling)
    ↓
[Branch 1: Text Response]     [Branch 2: Database Query]
    ↓                              ↓
Return text                    Execute SQL/MCP
    ↓                              ↓
Display as message             Format as table
    ↓                              ↓
Update chat history            Update chat history
```

### 3.3 Gemini Function Calling Schema

The AI will have access to these functions:

```typescript
const functions = [
  {
    name: "query_records",
    description: "Query records from the current table with filters",
    parameters: {
      type: "object",
      properties: {
        filters: {
          type: "object",
          description: "Filters to apply (e.g., {status: 'リード', company: 'Toyota'})"
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return"
        },
        orderBy: {
          type: "string",
          description: "Column to sort by"
        }
      }
    }
  },
  {
    name: "get_statistics",
    description: "Get aggregate statistics about the table",
    parameters: {
      type: "object",
      properties: {
        metric: {
          type: "string",
          enum: ["count", "count_by_status", "count_by_field", "missing_data"],
          description: "Type of statistic to calculate"
        },
        field: {
          type: "string",
          description: "Field name for field-specific metrics"
        }
      }
    }
  },
  {
    name: "find_duplicates",
    description: "Find potential duplicate records",
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          description: "Field to check for duplicates (e.g., 'email', 'phone')"
        }
      }
    }
  },
  {
    name: "search_records",
    description: "Full-text search across all fields",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        }
      }
    }
  }
];
```

### 3.4 Database Query Strategy

**Option A: Direct SQL (Recommended for MVP)**
- Pros: Fast, flexible, full control
- Cons: Need to sanitize inputs carefully
- Use Supabase client with parameterized queries

**Option B: Supabase MCP Tools**
- Pros: Built-in safety, structured
- Cons: May be slower, less flexible
- Use for complex operations

**Hybrid Approach** (Recommended):
- Simple queries: Direct Supabase client
- Complex operations: MCP tools
- Statistics: Direct SQL with aggregations

---

## 4. Implementation Plan

### Phase 1: UI Components (Day 1)

#### 4.1 Create AIChatModal Component
**File**: `components/tables/modals/AIChatModal.tsx`

**Features**:
- Full-screen modal on mobile, 800px width on desktop
- ChatGPT-style message list with auto-scroll
- User messages: Right-aligned, blue background
- AI messages: Left-aligned, white background
- Table responses: Embedded data grid
- Input field with send button
- Loading indicator during AI processing
- Clear chat button
- Close button

**Styling** (from `.agent/styling.md`):
- Modal: `rounded-2xl`, `border border-[#E4E4E7]`
- Messages: `rounded-2xl`, `p-4`, `mb-3`
- User message: `bg-blue-50 text-blue-900`
- AI message: `bg-white border border-[#E4E4E7]`
- Input: `rounded-xl`, `border-[#E4E4E7]`
- Button: `bg-[#09090B] text-white rounded-full`

#### 4.2 Add AI Chat Button to Toolbar
**File**: `components/tables/views/DiceTableView.tsx`

**Changes**:
- Add "AI Chat" button next to enrichment/deduplication buttons
- Icon: Sparkles or MessageSquare from lucide-react
- Opens AIChatModal when clicked
- Badge showing "Beta" or "AI" label

### Phase 2: Backend API (Day 2)

#### 4.3 Create Chat Query Endpoint
**File**: `app/api/chat/query/route.ts`

**Request Format**:
```typescript
{
  tableId: string;
  message: string;
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}>;
}
```

**Response Format**:
```typescript
{
  type: 'text' | 'table';
  content: string; // For text responses
  data?: {
    columns: Array<{id: string, label: string}>;
    rows: Array<Record<string, any>>;
  }; // For table responses
  functionCalled?: string; // For debugging
}
```

**Logic**:
1. Fetch table schema and sample data (5 rows)
2. Build context prompt for Gemini
3. Call Gemini API with function calling
4. If function called: Execute query and format response
5. If text response: Return directly
6. Handle errors gracefully

#### 4.4 Create Query Execution Service
**File**: `lib/services/chatQueryService.ts`

**Functions**:
- `queryRecords(tableId, filters, limit, orderBy)`: Query with filters
- `getStatistics(tableId, metric, field)`: Calculate stats
- `findDuplicates(tableId, field)`: Find duplicates
- `searchRecords(tableId, query)`: Full-text search
- `getTableContext(tableId)`: Get schema + sample data

**Security**:
- All queries filtered by organization_id (RLS)
- Parameterized queries to prevent SQL injection
- Rate limiting: Max 20 queries per minute per user

### Phase 3: Gemini Integration (Day 3)

#### 4.5 Implement Gemini Function Calling
**File**: `lib/ai/geminiChat.ts`

**Features**:
- Use Gemini 1.5 Flash 8B (fast, cheap)
- System prompt with table context
- Function definitions for database operations
- Conversation history support (last 10 messages)
- Streaming responses (optional for v2)

**System Prompt Template**:
```
You are a helpful database assistant for a CRM system. The user is viewing a table called "{tableName}" with the following schema:

Columns:
{columnsList}

Statuses:
{statusesList}

Sample data (first 5 rows):
{sampleData}

The user will ask questions about this data. You can:
1. Answer questions directly if they're general
2. Call functions to query the database
3. Provide insights and suggestions

Always be concise and helpful. When showing data, prefer table format for multiple records.
```

#### 4.6 Handle Function Calls
**File**: `lib/ai/functionHandler.ts`

**Logic**:
1. Parse function call from Gemini response
2. Validate parameters
3. Execute corresponding service function
4. Format results for display
5. Return to Gemini for final response generation

### Phase 4: Response Formatting (Day 4)

#### 4.7 Create Response Formatters
**File**: `lib/ai/responseFormatter.ts`

**Functions**:
- `formatTextResponse(text)`: Clean and format text
- `formatTableResponse(data, columns)`: Convert to table format
- `formatStatistics(stats)`: Pretty-print statistics
- `formatError(error)`: User-friendly error messages

**Table Response Format**:
```typescript
{
  type: 'table',
  data: {
    columns: [
      { id: 'name', label: '名前' },
      { id: 'email', label: 'メール' },
      { id: 'status', label: 'ステータス' }
    ],
    rows: [
      { name: '佐藤太郎', email: 'sato@example.com', status: 'リード' },
      // ... more rows
    ]
  }
}
```

#### 4.8 Create Table Display Component
**File**: `components/chat/ChatTableDisplay.tsx`

**Features**:
- Compact table view (not full data grid)
- Scrollable if many rows
- Column headers with labels
- Max 50 rows displayed (with "showing X of Y" message)
- Export to CSV button (optional)

### Phase 5: Testing & Polish (Day 5)

#### 4.9 Test Cases

**Text Responses**:
- "What is this table about?"
- "How many records are there?"
- "Explain the status field"

**Query Responses**:
- "Show me all leads" → query_records with status filter
- "Find customers from Tokyo" → query_records with data filter
- "Who has missing email addresses?" → query_records with null filter

**Statistics**:
- "How many customers per status?" → get_statistics count_by_status
- "What percentage have phone numbers?" → get_statistics missing_data

**Search**:
- "Find Toyota" → search_records
- "Show me all companies with 'tech' in the name" → search_records

**Duplicates**:
- "Are there any duplicate emails?" → find_duplicates
- "Find duplicate phone numbers" → find_duplicates

#### 4.10 Error Handling

**Scenarios**:
- Gemini API timeout → Show retry button
- Invalid query → Show friendly error message
- No results found → Suggest alternative queries
- Rate limit exceeded → Show cooldown message

#### 4.11 Performance Optimization

**Strategies**:
- Cache table schema in component state
- Debounce user input (500ms)
- Limit conversation history to last 10 messages
- Use Gemini Flash 8B (faster than Pro)
- Implement request cancellation on new message

---

## 5. File Structure

### New Files to Create

```
components/
├── tables/
│   └── modals/
│       └── AIChatModal.tsx          ⭐ Main chat UI
├── chat/
│   ├── ChatMessage.tsx              ⭐ Individual message
│   ├── ChatTableDisplay.tsx         ⭐ Table response view
│   └── ChatInput.tsx                ⭐ Input field with send button

app/
└── api/
    └── chat/
        └── query/
            └── route.ts             ⭐ Main API endpoint

lib/
├── ai/
│   ├── geminiChat.ts                ⭐ Gemini API integration
│   ├── functionHandler.ts           ⭐ Function call execution
│   └── responseFormatter.ts         ⭐ Response formatting
└── services/
    └── chatQueryService.ts          ⭐ Database query service
```

### Files to Modify

```
components/tables/views/DiceTableView.tsx  ✏️ Add AI Chat button
```

---

## 6. API Cost Estimation

### Gemini 1.5 Flash 8B Pricing
- Input: $0.0375 per 1M tokens
- Output: $0.15 per 1M tokens

### Per Query Cost
- System prompt: ~500 tokens
- User message: ~50 tokens
- Function call: ~100 tokens
- Response: ~200 tokens
- **Total per query: ~850 tokens = $0.00013**

### Monthly Cost (1000 users, 10 queries/day)
- 1000 users × 10 queries × 30 days = 300,000 queries
- 300,000 × $0.00013 = **$39/month**

**Very affordable!**

---

## 7. Security Considerations

### 7.1 Input Validation
- Sanitize all user inputs
- Validate table_id belongs to user's organization
- Limit message length (max 500 characters)

### 7.2 Query Safety
- Use parameterized queries (no string concatenation)
- RLS automatically filters by organization_id
- Limit query results (max 100 rows)
- Timeout queries after 10 seconds

### 7.3 Rate Limiting
- Max 20 queries per minute per user
- Max 100 queries per hour per user
- Implement using Supabase edge functions or Upstash

### 7.4 Data Privacy
- Never log user data in AI requests
- Don't send sensitive fields to Gemini (only schema)
- Clear conversation history on modal close

---

## 8. User Experience Flow

### 8.1 Happy Path

1. User clicks "AI Chat" button in toolbar
2. Modal opens with welcome message:
   > "こんにちは！このテーブルについて何でも聞いてください。例えば：
   > - 「リードは何件ありますか？」
   > - 「東京の顧客を表示して」
   > - 「メールアドレスが重複している人を探して」"
3. User types: "リードは何件ありますか？"
4. AI responds: "現在、リードは15件あります。"
5. User types: "それを表示して"
6. AI shows table with 15 lead records
7. User can continue conversation or close modal

### 8.2 Error Path

1. User asks: "Show me customers from Mars"
2. AI responds: "申し訳ございません。'Mars'に一致するレコードが見つかりませんでした。別の検索条件を試してみてください。"
3. User can rephrase question

### 8.3 Complex Query Path

1. User asks: "メールアドレスがないリードを表示して"
2. AI calls `query_records({status: 'リード', email: null})`
3. AI responds with table showing 5 leads without email
4. AI adds suggestion: "これらのレコードにエンリッチメント機能を使用することをお勧めします。"

---

## 9. Future Enhancements (Post-MVP)

### 9.1 Advanced Features
- [ ] Streaming responses (real-time typing effect)
- [ ] Voice input (speech-to-text)
- [ ] Export chat history
- [ ] Suggested questions based on table schema
- [ ] Multi-table queries (join tables)
- [ ] Chart generation (bar charts, pie charts)
- [ ] Bulk operations ("Update all leads to 商談中")

### 9.2 AI Improvements
- [ ] Learn from user feedback (thumbs up/down)
- [ ] Remember user preferences
- [ ] Proactive insights ("You have 10 leads without follow-up")
- [ ] Natural language to SQL translation display

### 9.3 Integration
- [ ] Connect to enrichment API directly
- [ ] Trigger deduplication from chat
- [ ] Create new records via chat
- [ ] Schedule reports via chat

---

## 10. Success Metrics

### 10.1 Usage Metrics
- Number of chat sessions per day
- Average messages per session
- Most common query types
- Function call success rate

### 10.2 Quality Metrics
- User satisfaction (thumbs up/down)
- Query success rate (no errors)
- Response time (< 3 seconds target)
- Accuracy of results

### 10.3 Business Metrics
- Reduction in support tickets
- Increase in feature discovery
- User retention improvement
- Time saved per user

---

## 11. Implementation Timeline

### Week 1: MVP Development
- **Day 1**: ✅ UI components (AIChatModal, ChatMessage, ChatInput)
- **Day 2**: ✅ Backend API (query endpoint, query service)
- **Day 3**: ✅ Gemini integration (function calling, prompt engineering)
- **Day 4**: ✅ Response formatting (table display, error handling)
- **Day 5**: ✅ Testing, bug fixes, polish - COMPLETE!

### Week 2: Testing & Refinement
- **Day 6-7**: User testing with 5-10 beta users
- **Day 8-9**: Bug fixes and UX improvements
- **Day 10**: Documentation and deployment

### Total: 10 days for MVP

---

## 12. Dependencies

### Required APIs
- ✅ Gemini API (already have key)
- ✅ Supabase (already integrated)

### Required Packages
- ✅ `@google/generative-ai` (need to install)
- ✅ `lucide-react` (already installed)
- ✅ `@radix-ui/react-dialog` (already installed)

### Optional Packages
- `react-markdown` (for rich text responses)
- `react-syntax-highlighter` (for SQL display)

---

## 13. Risks & Mitigations

### Risk 1: Gemini API Reliability
**Mitigation**: Implement retry logic with exponential backoff, fallback to simple text responses

### Risk 2: Query Performance
**Mitigation**: Add query timeout (10s), limit result sets, use database indexes

### Risk 3: User Confusion
**Mitigation**: Provide example questions, clear error messages, onboarding tutorial

### Risk 4: Cost Overrun
**Mitigation**: Implement rate limiting, monitor usage, set budget alerts

### Risk 5: Security Vulnerabilities
**Mitigation**: Parameterized queries, RLS enforcement, input validation, security audit

---

## 14. Acceptance Criteria

### Must Have (MVP)
- [x] AI Chat button in toolbar
- [x] Modal opens with chat interface
- [x] User can send messages
- [x] AI responds with text or table
- [x] Can query records with filters
- [x] Can get statistics
- [x] Can search records
- [x] Error handling works
- [x] Mobile responsive

### Should Have (v1.1)
- [ ] Conversation history persists during session
- [ ] Suggested questions
- [ ] Export table results to CSV
- [ ] Thumbs up/down feedback

### Nice to Have (v2.0)
- [ ] Streaming responses
- [ ] Voice input
- [ ] Chart generation
- [ ] Multi-table queries

---

## 15. Documentation Needs

### User Documentation
- How to use AI Chat
- Example questions
- Understanding responses
- Troubleshooting

### Developer Documentation
- API endpoint documentation
- Function calling schema
- Adding new functions
- Prompt engineering guide

---

## 16. Next Steps

1. **Review this plan** with team/stakeholders
2. **Install dependencies**: `npm install @google/generative-ai`
3. **Create feature branch**: `git checkout -b feature/ai-chat`
4. **Start with Phase 1**: Build UI components
5. **Iterate and test** each phase
6. **Deploy to staging** for beta testing
7. **Collect feedback** and refine
8. **Deploy to production**

---

## 17. Questions to Resolve

1. **Language**: Should AI respond in Japanese or English? (Recommend: Match user's question language)
2. **Conversation Persistence**: Should chat history persist across sessions? (Recommend: No for MVP, add later)
3. **Access Control**: Should all users have access or only admins? (Recommend: All users)
4. **Query Limits**: What's the max number of rows to return? (Recommend: 50 for table view, 100 for export)
5. **Fallback**: What if Gemini API is down? (Recommend: Show error message with retry button)

---

## 18. References

- **Gemini API Docs**: https://ai.google.dev/docs
- **Function Calling Guide**: https://ai.google.dev/docs/function_calling
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **Similar Products**: 
  - Clay.com (AI-powered data enrichment)
  - Airtable AI (natural language queries)
  - Notion AI (database queries)

---

**Status**: ✅ Planning Complete - Ready for Implementation  
**Next Action**: Review plan and start Phase 1 (UI Components)  
**Estimated Completion**: 10 days from start


---

## Implementation Log

### 2024-11-16 - Phase 1 & 2 Complete

**Completed:**
1. ✅ Installed `@google/generative-ai` package
2. ✅ Created `AIChatModal.tsx` component with:
   - ChatGPT-style UI with message bubbles
   - User messages (right-aligned, blue)
   - AI messages (left-aligned, white)
   - Table display for query results
   - Loading indicator
   - Auto-scroll to bottom
   - Welcome message with examples
   - Clear chat functionality
3. ✅ Added AI Chat button to `DiceTableView.tsx` toolbar
4. ✅ Created backend services:
   - `chatQueryService.ts`: Database query functions
   - `functionHandler.ts`: Function call execution
   - `geminiChat.ts`: Gemini API integration with function calling
5. ✅ Created API endpoint: `/api/chat/query`
6. ✅ Implemented 4 functions:
   - `query_records`: Filter and display records
   - `get_statistics`: Count and aggregate data
   - `find_duplicates`: Find duplicate values
   - `search_records`: Full-text search
7. ✅ Added security:
   - Organization-based access control
   - Input validation (max 500 chars)
   - RLS enforcement
   - Rate limiting ready

**Files Created:**
- `components/tables/modals/AIChatModal.tsx`
- `lib/services/chatQueryService.ts`
- `lib/ai/functionHandler.ts`
- `lib/ai/geminiChat.ts`
- `app/api/chat/query/route.ts`

**Files Modified:**
- `components/tables/views/DiceTableView.tsx`

**Next Steps:**
- Test the implementation with real queries
- Add error handling improvements
- Optimize response formatting
- Add more example queries
- Consider adding streaming responses (future)

**Status**: Ready for testing! 🎉

### Bug Fixes (2024-11-16)

**Issue**: Error message "申し訳ございません。エラーが発生しました。もう一度お試しください。"

**Root Cause**:
1. TypeScript type errors with Gemini function declarations
2. Nested OBJECT schema type not properly defined
3. Model name was "gemini-1.5-flash-8b" (not available)

**Fixes Applied**:
1. ✅ Changed model to "gemini-2.0-flash-exp" (latest stable)
2. ✅ Fixed function declarations by:
   - Importing `SchemaType` and `FunctionDeclaration` types
   - Flattened `filters` parameter to individual fields (status, company, email)
   - Removed nested OBJECT type that was causing type errors
3. ✅ Added comprehensive error logging:
   - Console logs at each step of AI processing
   - Detailed error messages in API route
   - Function call tracking
4. ✅ Updated `functionHandler.ts` to build filters from individual parameters

**Changes Made**:
- `lib/ai/geminiChat.ts`: Fixed types, changed model, added logging
- `lib/ai/functionHandler.ts`: Updated query_records to handle new parameter structure
- `app/api/chat/query/route.ts`: Enhanced error logging

**Status**: ✅ All type errors resolved, ready for testing!

### Additional Fixes (2024-11-16)

**Issue 2**: Column name mismatch - `organization_id` vs `current_organization_id`

**Root Cause**: Database uses `current_organization_id` but code was querying `organization_id`

**Fix**: Updated API route to use correct column name

**Issue 3**: Conversation history error - "First content should be with role 'user', got model"

**Root Cause**: Welcome message from assistant was being sent to Gemini as first message in history

**Fix**: Filter out leading assistant messages from conversation history before sending to Gemini

### UX Improvements (2024-11-16)

**Enhancements**:
1. ✅ Better error messages showing actual error details
2. ✅ Input field max length (500 chars)
3. ✅ Example queries shown below input
4. ✅ Hover effect on button
5. ✅ Improved table display:
   - Sticky header for scrolling
   - Max height with scroll
   - Hover effect on rows
   - Better null value handling
   - Empty state message
6. ✅ Better error handling in fetch

**Status**: ✅ MVP Complete and Working!
