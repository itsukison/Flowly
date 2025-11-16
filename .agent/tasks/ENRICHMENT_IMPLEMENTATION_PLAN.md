# Contact Enrichment Feature - Implementation Plan

## Overview
Implemented a contact information enrichment feature that allows users to automatically find and populate contact details (担当者、メール、電話) for Japanese companies by searching their 特定商取引法 pages.

---

## Architecture

### Data Flow
```
User Action (Select Rows + Click Button)
    ↓
EnrichmentModal (Configuration)
    ↓
API Endpoint (/api/enrich/contact)
    ↓
EnrichmentService (Firecrawl Integration)
    ↓
ContactParser (Regex + Gemini Fallback)
    ↓
Database Update (Supabase)
    ↓
Results Display (Modal)
```

### Component Structure
```
components/tables/
├── views/
│   └── DiceTableView.tsx (Modified - Added enrichment button)
└── modals/
    └── EnrichmentModal.tsx (New - Configuration & results UI)

lib/
├── services/
│   └── enrichmentService.ts (New - Firecrawl integration)
└── utils/
    └── contactParser.ts (New - Parsing logic)

app/api/
└── enrich/
    └── contact/
        └── route.ts (New - API endpoint)
```

---

## Implementation Details

### 1. User Interface (EnrichmentModal.tsx)

**Features:**
- Three-step wizard: Config → Processing → Results
- Source column selection (company name or URL)
- Target field selection (email, phone, representative)
- Real-time progress tracking
- Detailed results with confidence scores

**UI Flow:**
1. **Config Step:**
   - Info banner recommending URL for better results
   - Radio buttons for source column selection
   - Checkboxes for target fields
   - Validation before proceeding

2. **Processing Step:**
   - Progress bar showing X/Y records processed
   - Loading state with spinner

3. **Results Step:**
   - Success/failure summary
   - Detailed results for each record
   - Confidence scores and source information
   - Error messages for failed records

### 2. API Endpoint (app/api/enrich/contact/route.ts)

**Endpoint:** `POST /api/enrich/contact`

**Request Body:**
```json
{
  "recordIds": ["uuid1", "uuid2", ...],
  "sourceColumn": "company" | "url",
  "targetFields": ["email", "phone", "representative"]
}
```

**Response:**
```json
{
  "success": true,
  "processed": 10,
  "successCount": 8,
  "failureCount": 2,
  "results": [
    {
      "recordId": "uuid1",
      "success": true,
      "data": {
        "email": "info@example.com",
        "phone": "03-1234-5678",
        "representative": "山田太郎",
        "confidence": 85,
        "source": "crawl",
        "tokushoho_url": "https://..."
      }
    }
  ]
}
```

**Logic:**
1. Authenticate user
2. Validate request parameters
3. Fetch records from database
4. Process each record:
   - Determine strategy (URL → crawl, name → search)
   - Call enrichment service
   - Update record with results
5. Return aggregated results

### 3. Enrichment Service (lib/services/enrichmentService.ts)

**Two Strategies:**

#### Strategy A: URL-based (Crawl)
- Input: Company website URL
- Process:
  1. Start Firecrawl crawl job (limit: 15 pages)
  2. Filter for 特定商取引法 pages
  3. Poll for completion (max 30s)
  4. Extract target page
  5. Parse contact info
- Accuracy: High (direct access to company site)
- Cost: ~$0.15 per company

#### Strategy B: Name-based (Search)
- Input: Company name
- Process:
  1. Search query: "{company name} 特定商取引法"
  2. Firecrawl search (limit: 3 results)
  3. Use first result
  4. Parse contact info
- Accuracy: Medium (depends on search results)
- Cost: ~$0.04 per company

**Functions:**
- `enrichByUrl(url: string): Promise<EnrichmentResult>`
- `enrichByCompanyName(name: string): Promise<EnrichmentResult>`

### 4. Contact Parser (lib/utils/contactParser.ts)

**Two-tier Parsing:**

#### Tier 1: Regex Patterns
Fast, cost-free extraction using regex:
- Email: `/(?:メールアドレス|Email|E-mail|mail)[:：\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i`
- Phone: `/(?:電話番号|TEL|Tel|電話)[:：\s]*(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/`
- Address: `/(?:住所|所在地|Address)[:：\s]*([^\n]{10,100})/`
- Representative: `/(?:代表者|代表取締役|CEO|代表)[:：\s]*([^\n]{2,20})/`

#### Tier 2: Gemini API Fallback
When regex confidence < 50%:
- Extract relevant section (50 lines around keywords)
- Send to Gemini 1.5 Flash
- Parse JSON response
- Merge with regex results

**Functions:**
- `parseContactInfo(markdown: string): ContactInfo`
- `parseWithGemini(markdown: string): Promise<Partial<ContactInfo>>`
- `normalizePhone(phone: string): string`
- `extractRelevantSection(markdown: string): string`

---

## Data Storage

### Record Structure
Enriched data is stored in the `record.data` JSONB field:

```json
{
  ...existing_fields,
  "enrichment": {
    "email": "info@example.com",
    "phone": "03-1234-5678",
    "address": "東京都...",
    "representative": "山田太郎",
    "confidence": 85,
    "source": "crawl",
    "tokushoho_url": "https://example.com/tokushoho",
    "enriched_at": "2024-11-16T12:00:00Z"
  }
}
```

**Benefits:**
- Keeps enrichment data separate from user data
- Tracks metadata (source, confidence, timestamp)
- Allows re-enrichment without data loss
- Easy to query and display

---

## Integration Points

### DiceTableView.tsx Modifications

**Added:**
1. State management:
   ```typescript
   const [isEnrichmentOpen, setIsEnrichmentOpen] = useState(false);
   const [recordsForEnrichment, setRecordsForEnrichment] = useState([]);
   ```

2. Enrichment button in toolbar:
   ```tsx
   <Button
     variant="outline"
     size="sm"
     onClick={handleEnrichmentClick}
     disabled={selectedRows.length === 0}
   >
     連絡先を取得 ({selectedRows.length})
   </Button>
   ```

3. Modal component:
   ```tsx
   <EnrichmentModal
     open={isEnrichmentOpen}
     onOpenChange={setIsEnrichmentOpen}
     columns={columns}
     records={recordsForEnrichment}
     onComplete={() => router.refresh()}
   />
   ```

---

## Environment Variables

Required in `.env`:
```env
FIRECRAWL_KEY=fc-xxx...
GEMINI_API_KEY=AIzaSy...
```

---

## Error Handling

### API Level
- Authentication check (401 if not logged in)
- Parameter validation (400 for invalid input)
- Database errors (500 with error message)
- Timeout handling (30s max per record)

### Service Level
- Firecrawl API errors (network, rate limits)
- Crawl timeout (max 30s polling)
- Page not found (特定商取引法 page missing)
- Parsing failures (fallback to Gemini)

### UI Level
- Empty selection validation
- Processing state management
- Error display in results
- Graceful degradation

---

## Performance Considerations

### Optimization Strategies
1. **Sequential Processing:** Process records one by one to avoid rate limits
2. **Timeout Management:** 30s max per record prevents hanging
3. **Regex First:** Fast parsing before expensive AI calls
4. **Relevant Section Extraction:** Send only 50 lines to Gemini (reduces cost)

### Cost Estimation
- **With URL (Crawl):** ~$0.15 per company
- **Without URL (Search):** ~$0.04 per company
- **Gemini Fallback:** ~$0.001 per call (30% of cases)
- **Average:** ~$0.08 per company

### Scalability
- Current: Synchronous processing (good for < 50 records)
- Future: Queue system (Inngest/Upstash) for large batches
- Future: Caching layer (30-day cache for repeated lookups)

---

## Testing Checklist

### Manual Testing
- [ ] Select single row and enrich
- [ ] Select multiple rows and enrich
- [ ] Test with URL column
- [ ] Test with company name column
- [ ] Test with missing source data
- [ ] Verify results display correctly
- [ ] Check database updates
- [ ] Test error scenarios

### Edge Cases
- [ ] Empty source value
- [ ] Invalid URL format
- [ ] Company not found
- [ ] 特定商取引法 page not found
- [ ] Partial data (only email, no phone)
- [ ] Network timeout
- [ ] API rate limit

---

## Future Enhancements

### Phase 2
1. **Caching System:**
   - Store results in `enrichment_cache` table
   - 30-day expiration
   - Reduce costs for repeated lookups

2. **Batch Processing:**
   - Queue system for large datasets
   - Background job processing
   - Email notification on completion

3. **Confidence Filtering:**
   - Manual review workflow for low confidence
   - Bulk accept/reject interface

### Phase 3
1. **Email Verification:**
   - Integrate ZeroBounce or similar
   - Validate email deliverability
   - Mark invalid emails

2. **Data Enrichment:**
   - Company size, industry, revenue
   - Social media profiles
   - Additional contact persons

3. **Analytics:**
   - Success rate tracking
   - Cost monitoring
   - Quality metrics

---

## Maintenance

### Monitoring
- Track API usage (Firecrawl, Gemini)
- Monitor success/failure rates
- Alert on high error rates
- Cost tracking dashboard

### Updates
- Keep regex patterns updated
- Adjust Gemini prompts as needed
- Update Firecrawl parameters
- Refine confidence scoring

---

## Documentation

### User Guide
Location: To be created in `/docs/features/enrichment.md`

Topics:
- How to use the enrichment feature
- Best practices (URL vs name)
- Understanding confidence scores
- Troubleshooting common issues

### Developer Guide
Location: This document

Topics:
- Architecture overview
- API reference
- Service integration
- Testing procedures

---

## Conclusion

The contact enrichment feature is now fully implemented and integrated into the data table view. Users can select rows, configure enrichment options, and automatically populate contact information from Japanese company websites.

**Key Achievements:**
- ✅ Clean, modular architecture
- ✅ Two-tier parsing (regex + AI)
- ✅ Comprehensive error handling
- ✅ User-friendly interface
- ✅ Cost-effective implementation
- ✅ Scalable design

**Next Steps:**
1. User testing with real Japanese company data
2. Monitor API costs and success rates
3. Gather feedback for improvements
4. Implement caching system (Phase 2)
