# Phase 1: Landing Page Rebrand + Supabase Auth

## Status: ✅ COMPLETE
**Start Date**: 2025-11-09  
**Completion Date**: 2025-11-09  
**Duration**: <1 day

---

## Objectives

1. Update landing page content from "AI chatbot platform" to "Japan-First CRM Platform"
2. Maintain existing layout, styling, and animations (text-only changes)
3. Set up Supabase project via MCP
4. Implement authentication (sign up, login, logout)
5. Configure environment variables

---

## Part A: Landing Page Content Update

### Files to Modify:
- 📝 `Flowly/lib/translations.ts` - Update all translation strings

### Content Changes Required:

#### Hero Section
**Current**: "AI Support Agents for Modern Businesses"  
**New**: "Smart CRM for Japanese Businesses"

**Current Subheading**: "Deploy custom AI chatbots..."  
**New Subheading**: "Eliminate duplicate data, enrich customer information automatically, and manage your business relationships the way Japanese companies actually work."

**Current CTA**: "Get Started Now"  
**New CTA**: "Start Free Trial" / "無料で始める"

#### Highlights Section (3 Cards)
**Badge**: "Why Flowly" → "Core Features" / "主な機能"

**Card 1**: 
- Title: "Smart Data Import" / "スマートデータ取り込み"
- Desc: "Drag-and-drop Excel/CSV files. AI automatically maps columns, even with Japanese naming variations like 会社名, 企業名, 社名."

**Card 2**:
- Title: "Automatic Deduplication" / "自動重複排除"
- Desc: "Real-time duplicate detection with AI-powered merge suggestions. Never manage the same customer twice across departments."

**Card 3**:
- Title: "Contact Enrichment" / "連絡先情報の自動補完"
- Desc: "One-click enrichment finds missing emails, phone numbers, and company details from Japanese corporate databases."

#### How It Works Section (5 Steps)
**Badge**: "How it works" → "Getting Started" / "使い方"  
**Title**: "From Excel to organized CRM in minutes"

**Step 1**: "Upload your customer data"  
- Desc: "Import Excel or CSV files. Our AI handles Japanese naming variations automatically."

**Step 2**: "Auto-deduplicate records"  
- Desc: "System detects duplicates across departments and suggests smart merges."

**Step 3**: "Enrich missing information"  
- Desc: "One-click enrichment fills in missing emails, phone numbers, and company details."

**Step 4**: "Track customer status"  
- Desc: "Visual kanban board shows where each customer is: リード → 商談中 → 契約 → 運用中."

**Step 5**: "Search and manage easily"  
- Desc: "Fast search across all fields. Filter by status, assigned person, or missing data."

#### Features Section (2 Cards)
**Badge**: "Features" → "Advanced Features" / "高度な機能"

**Feature 1**: "Flexible Custom Forms"  
- Desc: "Add custom fields without IT help. Every business is different—your CRM should adapt to you, not the other way around."

**Feature 2**: "Japanese-First Design"  
- Desc: "Handles full-width/half-width characters, furigana support, and Japanese business workflows natively."

#### Testimonials Section
**Badge**: "Success Stories" → "Customer Stories" / "お客様の声"  
**Title**: "Japanese businesses love Flowly"

**Update testimonials to CRM context**:
- Testimonial 1: "We were drowning in Excel sheets with duplicate customers. Flowly cleaned up our data in one afternoon and now we spend 2 hours a week on CRM instead of 10."
- Testimonial 2: "The auto-enrichment is magic. We had 500 company names but missing contact info. Flowly found 80% of the emails and phone numbers automatically."
- Testimonial 3: "Finally, a CRM that understands Japanese business. No more fighting with rigid formats or English-first interfaces."
- Testimonial 4: "Our sales team actually uses this CRM because it's so simple. The kanban board shows customer status at a glance."
- Testimonial 5: "Excel卒業できました！(Graduated from Excel!) Flowly handles everything we need without the complexity of enterprise CRMs."

**Stats**:
- Stat 1: "1,200+ companies" / "1,200社以上" - "using Flowly to manage customers"
- Stat 2: "90% reduction" / "90%削減" - "in data management time"

#### Intro Section (Services Tags)
**Badge**: "Our Channels" → "What We Do" / "機能"  
**Title**: "Transform messy spreadsheets into organized customer relationships"

**Tags** (replace service tags):
- "Smart Import" / "スマート取り込み"
- "Deduplication" / "重複排除"
- "Enrichment" / "情報補完"
- "Status Tracking" / "ステータス管理"
- "Custom Forms" / "カスタムフォーム"
- "Fast Search" / "高速検索"

#### Pricing Section
**Badge**: "Pricing" → "Simple Pricing" / "料金プラン"  
**Title**: "Simple Pricing, Powerful CRM"

**Plans**:
- Starter: ¥9,800/月 (up to 500 customers, 3 users)
- Growth: ¥29,800/月 (up to 5,000 customers, 10 users)
- Business: ¥79,800/月 (unlimited customers, unlimited users)

**Features included**:
- Smart data import with AI mapping
- Automatic deduplication
- Contact enrichment (100 enrichments/month for Starter)
- Custom fields and forms
- Status tracking kanban
- Mobile access
- Email support

#### FAQ Section
**Update questions to CRM context**:
1. "How does the AI handle Japanese company name variations?"
2. "Can I import data from multiple Excel files?"
3. "What happens if the system finds duplicate customers?"
4. "How does contact enrichment work?"
5. "Can I customize the customer status stages?"
6. "Is my customer data secure?"
7. "Do you support mobile access?"

#### Footer
**Update links**:
- Product → Features, Pricing, Security, Integrations
- Resources → Help Center, API Docs, Import Guide, Blog
- Company → About, Careers, Privacy, Terms

---

## Part B: Supabase Setup via MCP

### Step 1: Create Supabase Project
Use Supabase MCP to:
1. Check if project exists
2. Get project URL and keys
3. Store in .env file

### Step 2: Configure Environment Variables
Update `Flowly/.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Install Supabase Client
```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Step 4: Create Supabase Client Utilities
**New files to create**:
- `Flowly/lib/supabase/client.ts` - Browser client
- `Flowly/lib/supabase/server.ts` - Server client
- `Flowly/lib/supabase/middleware.ts` - Auth middleware

---

## Part C: Authentication Implementation

### Step 1: Create Auth UI Components
**New components**:
- `Flowly/components/auth/LoginForm.tsx`
- `Flowly/components/auth/SignupForm.tsx`
- `Flowly/components/auth/AuthModal.tsx`

### Step 2: Create Auth Pages
**New pages**:
- `Flowly/app/login/page.tsx`
- `Flowly/app/signup/page.tsx`
- `Flowly/app/dashboard/page.tsx` (placeholder)

### Step 3: Update Header Component
Modify `Flowly/components/Header.tsx`:
- Add auth state detection
- Show "Login" / "Sign Up" when logged out
- Show user menu when logged in
- Add logout functionality

### Step 4: Implement Auth Context
**New file**: `Flowly/contexts/AuthContext.tsx`
- Manage auth state
- Provide user info
- Handle login/logout/signup

### Step 5: Add Middleware for Protected Routes
**New file**: `Flowly/middleware.ts`
- Protect /dashboard routes
- Redirect to login if not authenticated

---

## Implementation Checklist

### Content Update
- [x] Update translations.ts with all new CRM-focused content (EN)
- [x] Update translations.ts with all new CRM-focused content (JA)
- [x] Test language toggle works with new content
- [x] Verify all sections display correctly
- [x] Check mobile responsiveness

### Supabase Setup
- [x] Use MCP to get Supabase project details
- [x] Configure .env.local with Supabase keys
- [x] Install @supabase/supabase-js and @supabase/ssr
- [x] Create client utilities (browser, server, middleware)
- [x] Test connection to Supabase

### Auth Implementation
- [x] Create LoginForm component
- [x] Create SignupForm component
- [x] Create login page
- [x] Create signup page
- [x] Create placeholder dashboard page
- [x] Update Header with auth state
- [x] Add middleware for protected routes
- [x] No TypeScript errors

### Files Created
- ✅ `lib/supabase/client.ts` - Browser client
- ✅ `lib/supabase/server.ts` - Server client
- ✅ `lib/supabase/middleware.ts` - Auth middleware
- ✅ `components/auth/LoginForm.tsx` - Login form
- ✅ `components/auth/SignupForm.tsx` - Signup form
- ✅ `app/login/page.tsx` - Login page
- ✅ `app/signup/page.tsx` - Signup page
- ✅ `app/dashboard/page.tsx` - Dashboard placeholder
- ✅ `middleware.ts` - Route protection
- ✅ `.env.local` - Environment variables

### Files Modified
- ✅ `lib/translations.ts` - All CRM content updated (EN + JA)
- ✅ `components/Header.tsx` - Auth state integration

---

## Design Constraints

**MUST MAINTAIN**:
- All existing styling from styling.md
- Layout structure (sections, grids, spacing)
- Animations (slideshow, ticker, noise)
- Color palette
- Typography hierarchy
- Component patterns (badges, buttons, cards)
- Responsive breakpoints

**ONLY CHANGE**:
- Text content in translations.ts
- Add auth components (following styling guide)
- Add auth pages (following styling guide)

---

## Success Criteria

✅ Landing page accurately represents CRM platform  
✅ All content is bilingual (EN/JA)  
✅ Supabase project connected  
✅ Users can sign up with email/password  
✅ Users can log in  
✅ Users can log out  
✅ Protected routes work  
✅ Auth state persists on refresh  
✅ No styling regressions  
✅ Mobile responsive  

---

## Next Phase Preview

After Phase 1 completion, Phase 2 will focus on:
- Database schema design
- Creating organizations, users, customers tables
- Setting up Row-Level Security (RLS)
- Implementing multi-tenancy

---

**Last Updated**: 2025-11-09  
**Status**: ✅ Complete  
**Actual Time**: <1 day

---

## Summary

Phase 1 successfully completed:
- Landing page rebranded from AI chatbot to Japan-First CRM
- All content updated in English and Japanese
- Supabase project connected
- Full authentication flow implemented (signup, login, logout)
- Protected routes working
- Dashboard placeholder created
- No TypeScript errors

Ready to proceed to Phase 2: Database Schema + Multi-tenancy
