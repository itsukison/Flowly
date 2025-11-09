Product Requirements Document: Japan-First CRM Platform
1. Product Vision
Problem Statement
 Japanese companies waste hours manually managing customer data across fragmented Excel sheets, struggling with duplicate entries, missing contact information, and rigid data formats that don't match their workflows.
Solution
 A flexible, Japanese-first CRM that automatically enriches customer data, eliminates duplicates, and adapts to how Japanese businesses actually work—not the other way around.
Success Metric
 Reduce CRM data management time from 10+ hours/week to under 2 hours/week per team.
Inspired by https://ozma.io/ and https://www.floqer.com/

2. Target User
Primary: Small-to-medium Japanese companies (10-200 employees) with sales/customer success teams
Currently using Excel or basic tools
Have duplicate customer records across departments
Spend 2+ hours daily on data entry and cleanup
Need contact info (email, phone) but don't have resources to find it manually

3. Core Features (MVP)
3.1 Smart Data Import
User Pain: "It takes forever to format Excel data correctly"
Solution:
Drag-and-drop Excel/CSV upload
AI auto-maps columns to CRM fields (handles Japanese naming variations: "会社名", "企業名", "社名" all map to "Company")
Preview before import with confidence scores
One-click import—no manual field mapping
Why Essential: Removes biggest barrier to CRM adoption in Japan

3.2 Automatic Deduplication
User Pain: "Same customer exists in 3 different sheets with different info"
Solution:
Real-time duplicate detection on upload
Shows merge preview: "Found 3 matches for トヨタ自動車. Merge?"
AI suggests which data to keep (most recent, most complete)
Batch deduplication for existing data
Merge history tracking (can undo if needed)
Why Essential: Core pain point you identified at TikTok

3.3 Contact Information Enrichment
User Pain: "We have company names but missing emails and phone numbers"
Solution:
One-click "Enrich" button on customer record
Automatically finds:
Company emails (general + key contacts)
Phone numbers
Company address
Employee count
Industry classification
Sources: Japanese corporate databases, LinkedIn Japan, company websites
Shows source and confidence level for each data point
Why Essential: Saves hours of manual research per customer

3.4 Customer Status Tracking
User Pain: "Don't know which stage customers are at (opened shop? signed contract?)"
Solution:
Visual kanban board with customizable stages
Default: リード → 商談中 → 契約 → 運用中 → 休眠
Drag-and-drop to update status
Auto-timestamp when status changes
Dashboard shows: "15 customers in 商談中, 8 need follow-up this week"
Mobile view for checking status on-the-go
Why Essential: Provides visibility TikTok system lacked

3.5 Flexible Custom Forms
User Pain: "Every customer needs different information tracked"
Solution:
Start with template, customize what you need
Add/remove fields without IT help
Field types: text, number, date, dropdown, checkbox, file upload
Conditional fields (if "契約済み" then show "契約金額")
No mandatory fields except customer name
Why Essential: Japanese business requirements vary—flexibility is critical

3.6 Simple Search & Filters
User Pain: "Can't find customers quickly"
Solution:
Universal search bar (searches name, email, phone, notes)
Quick filters:
By status
By担当者 (assigned person)
Last contact date
Missing data (show all without email)
Save common filter combinations
Search results show context snippet
Why Essential: Fast access = system gets used

4. Features Explicitly NOT Included (MVP)
❌ Email marketing integration - Users have existing tools
 ❌ Complex reporting/analytics - Too early, adds complexity
 ❌ Multi-currency accounting - Not core to CRM problem
 ❌ AI chatbot - Gimmicky, doesn't solve real pain
 ❌ Social media monitoring - Nice-to-have, not essential
 ❌ Document generation - Can add later if needed
 ❌ Time tracking - Different problem space

5. User Experience Flow
First-Time User (Onboarding - 5 minutes)
Sign up → Choose plan
"どのようにデータを追加しますか？"
Upload Excel → Guided import
Add manually → Simple form
Connect existing tool (later)
Auto-deduplication runs
"Enrich 取引先のデータ？" → One click enrichment
Done. See customers on dashboard.
Daily User Flow
Open app → Dashboard shows:
Customers needing follow-up today
Status breakdown
Recently added customers
Click customer → See full details + activity history
Update status (drag-and-drop or dropdown)
Add note about conversation
Close
Time: Under 30 seconds per update

6. Technical Requirements
Performance
Page load: <2 seconds
Import 1000 rows: <10 seconds
Enrichment per customer: <5 seconds
Mobile responsive (60% of Japanese users on mobile)
Data Sources (Japan-Specific)
Japanese corporate databases API
LinkedIn Japan scraping (compliant)
Company website parsing
Open government business registries
Security
SOC 2 compliance pathway
Data encryption at rest and transit
Role-based access control
Activity audit logs
GDPR + Japanese data privacy compliance
Language
Japanese-first UI (priority)
English toggle available
Support Japanese character encoding (UTF-8)
Handle full-width vs half-width characters

7. Success Criteria (First 6 Months)
Adoption:
100 paying companies
70%+ weekly active usage rate
Average 15+ customers managed per company
Customer Experience:
NPS >40
<5% churn rate
80%+ say "saves significant time" in survey
Core Functionality:
90%+ successful auto-deduplications
70%+ enrichment success rate
<2% data quality complaints

8. Go-to-Market Strategy
Pricing (monthly):
Starter: ¥9,800 (up to 500 customers, 3 users)
Growth: ¥29,800 (up to 5,000 customers, 10 users)
Business: ¥79,800 (unlimited, unlimited users)
Launch Plan:
Beta with 10 friendly companies (free, feedback intensive)
Refine based on feedback
Launch on Japanese startup communities (ProductHunt JP, Note)
Partner with business consultants who serve SMBs
Content marketing: "Excel卒業ガイド" (Graduate from Excel Guide)
Positioning: "The CRM that finally works for Japanese businesses"

9. Future Roadmap (Post-MVP)
Phase 2 (Months 7-12):
Email integration (Gmail, Outlook)
Team collaboration features (shared notes, @mentions)
Basic reporting (customer growth, conversion rates)
Mobile app (currently just mobile web)
Phase 3 (Year 2):
Integrations marketplace (Slack, Teams, Kintone)
AI-powered insights ("Customer X hasn't been contacted in 60 days")
Document generation for contracts/invoices
Advanced automations

10. Open Questions
Data sources: Which Japanese corporate databases have best coverage + affordable pricing?
Enrichment limits: How many enrichments per month before it becomes cost-prohibitive?
Localization depth: Do we need prefecture-specific features (e.g., Osaka vs Tokyo business practices)?
Integration priority: After MVP, what's most requested integration?

Appendix: Customer Validation
From TikTok internship observations:
✅ Time spent on manual data entry: 10+ hours/week per team
✅ Duplicate customers across departments: Major pain
✅ Missing contact info: Daily frustration
✅ Rigid format requirements: Barrier to updates
✅ Unclear customer status: Causes confusion




Architecture
1. Data Enrichment Architecture (MOST CRITICAL)
Problem: Enrichment takes 5-30 seconds per customer. You can't block the UI.
Decision needed:
✅ Queue-based (Recommended): Use Supabase Edge Functions + queue system
User clicks "Enrich" → Job added to queue → Returns immediately
Background worker processes enrichments
WebSocket/polling updates UI when done
Handles rate limits from data providers
Can batch enrich 100s of customers
❌ Direct API calls: Will timeout, poor UX, can't scale
Implementation: Supabase Edge Functions + Upstash Redis (for queue) or inngest.com (easier)

2. Deduplication Strategy
Problem: Comparing 1000s of records for duplicates is expensive.
Decision needed:
✅ Fuzzy matching with PostgreSQL trigram indexes
sql
 CREATE INDEX customer_name_trgm ON customers 
  USING gin (name gin_trgm_ops);
Enable pg_trgm extension in Supabase
Handles "トヨタ" vs "トヨタ自動車" vs "Toyota"
Query: SELECT * FROM customers WHERE name % 'トヨタ'
Phone normalization: Strip formatting before comparison
"03-1234-5678" = "0312345678" = "03 1234 5678"
Company domain matching: Extract email domains
"john@toyota.co.jp" + "mary@toyota.co.jp" = same company
Run deduplication:
On import (batch check new records)
Nightly job for existing data
NOT on every insert (too slow)

3. Multi-tenancy Model
Problem: Multiple companies using your CRM, data must be isolated.
Decision needed:
✅ Row-Level Security (RLS) with organization_id (Recommended for Supabase)
sql
 CREATE POLICY "Users see own org data" ON customers
  FOR SELECT USING (organization_id = auth.jwt() -> 'organization_id');
Single database, secured by RLS
Simpler architecture
Supabase handles it natively
❌ Separate schemas per tenant: Overkill for MVP, harder to manage
Schema:
sql
organizations (id, name, plan, created_at)
users (id, organization_id, email, role)
customers (id, organization_id, name, email, phone, status...)

4. File Storage for Excel Imports
Problem: Users upload Excel files, you need to process them.
Decision needed:
✅ Supabase Storage + Edge Function processing
User uploads → Supabase Storage
Trigger Edge Function → Parse Excel (use SheetJS)
Insert into database with deduplication
Delete file after processing (or keep for history)
Important: Don't store large files long-term, just use for import process.

5. Real-time Updates vs Polling
Problem: Multiple users updating same customer, status changes, enrichment completes.
Decision needed:
✅ Supabase Realtime for critical updates
typescript
 supabase
    .channel('customers')
    .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'customers' },
        (payload) => updateUI(payload)
    )
Use for: Status changes, concurrent editing
Don't use for: Everything (expensive, unnecessary)
✅ Polling for background jobs
Enrichment status: Poll every 2 seconds while pending
Stop when complete

6. Search Architecture
Problem: Fast search across customers with Japanese text.
Decision needed:
✅ PostgreSQL Full-Text Search (MVP)
sql
 CREATE INDEX customer_search ON customers 
  USING gin (to_tsvector('japanese', name || ' ' || email));
Supabase Postgres supports Japanese tokenization
Good enough for <10k customers per org
🔄 Upgrade to Algolia/Meilisearch later (if search becomes slow)
Better for 100k+ records
Not needed for MVP

7. Japanese Text Handling
Critical considerations:
✅ Database collation: Use ja-JP or C collation
✅ Full-width/half-width normalization:
typescript
 const normalize = (str: string) => 
    str.normalize('NFKC'); // "１２３" → "123"
✅ Furigana support (optional but nice):
Store both kanji and reading: {name: "山田", furigana: "やまだ"}
Helps with sorting/search

8. Data Enrichment Provider Strategy
Problem: Need multiple data sources, they have rate limits and costs.
Decision needed:
✅ Waterfall approach (like Floqer):
Try free source (company website scraping)
If fails, try paid API (LinkedIn, corporate DB)
If fails, mark as "needs_manual_review"
✅ Cache enriched data: Store in your DB, don't re-fetch
✅ Rate limit handling: Queue system with exponential backoff
Suggested providers for Japan:
Free: Company website scraping
Paid: Clearbit (limited Japan coverage), LinkedIn Sales Navigator API
Japanese-specific: Needs research (Teikoku Databank API?)

9. Caching Strategy
For better performance:
✅ Dashboard stats: Cache in Redis (Upstash), refresh every 5 mins
"Customers by status" doesn't need real-time accuracy
✅ Customer list: Use Next.js ISR (Incremental Static Regeneration)
Revalidate every 60 seconds
✅ Individual customer: No cache, always fresh data

10. Mobile-First Considerations
60% of Japanese users on mobile (you mentioned):
✅ Server Components (Next.js App Router): Less JS to mobile
✅ Progressive Web App: Add manifest.json, installable
✅ Offline-first for reading: Cache customer list locally
✅ Optimistic UI updates: Update UI immediately, sync later
typescript
 // Update UI first
  setCustomerStatus('契約済み');
  // Then sync to server
  await supabase.from('customers').update({status: '契約済み'});
```

---

## **Recommended Tech Stack Details**
```
Frontend: Next.js 14 (App Router) + TypeScript + Tailwind
Backend: Supabase (Postgres + Auth + Storage + Edge Functions)
Queue: Inngest or Upstash Redis + QStash
Search: PostgreSQL Full-Text (MVP) → Meilisearch (later)
File Processing: SheetJS (Excel parsing)
Real-time: Supabase Realtime (selective)
Caching: Upstash Redis (optional for MVP)
Monitoring: Sentry + Vercel Analytics

MVP Architecture Decision Matrix
Feature
Implementation
Why
Enrichment
Queue-based (Inngest)
Can't block UI 5-30 seconds
Deduplication
PostgreSQL trigrams
Built-in, good for Japanese
Multi-tenancy
RLS with org_id
Supabase native support
Import
Edge Function + Storage
Serverless, scalable
Search
PostgreSQL FTS
Good enough for MVP
Real-time
Selective Supabase RT
Only where needed
Mobile
PWA + Server Components
60% mobile users


