# Dashboard Architecture

## Overview

The dashboard is built with Next.js 16 App Router, using Server Components for data fetching and Client Components for interactivity. The design follows the styling guide with a spacious, high-end layout using black/white color palette.

## Layout Structure

```
/app/dashboard/
├── layout.tsx          # Authenticated layout with sidebar
├── page.tsx            # Dashboard home
├── customers/
│   ├── page.tsx        # Customer list
│   └── [id]/
│       └── page.tsx    # Customer detail (future)
├── import/
│   └── page.tsx        # Data import (future)
├── status/
│   └── page.tsx        # Kanban board (future)
└── settings/
    └── page.tsx        # Settings (future)
```

## Components

### Dashboard Layout (`/app/dashboard/layout.tsx`)

**Purpose**: Provides authenticated layout wrapper with sidebar and header.

**Features**:
- Authentication check (redirects to login if not authenticated)
- Fetches user profile and organization
- Renders sidebar navigation
- Renders header with user menu
- Responsive layout (sidebar on desktop, bottom nav on mobile)

**Server Component**: Yes (fetches user data)

---

### Sidebar (`/components/dashboard/Sidebar.tsx`)

**Purpose**: Navigation menu for dashboard sections.

**Features**:
- Desktop: Fixed left sidebar (64px width)
- Mobile: Bottom navigation bar
- Active state highlighting
- Icons from lucide-react
- Navigation items:
  - ダッシュボード (Dashboard)
  - 顧客管理 (Customers)
  - ステータス管理 (Status Board)
  - 設定 (Settings)

**Client Component**: Yes (uses usePathname for active state)

**Styling**:
- Active: `bg-[#09090B] text-white`
- Inactive: `text-[#71717B] hover:bg-[#F4F4F5]`
- Rounded: `rounded-xl`
- Spacious padding: `px-4 py-3`

---

### Header (`/components/dashboard/Header.tsx`)

**Purpose**: Top navigation bar with user menu.

**Features**:
- Fixed position with backdrop blur
- Organization name display
- User avatar and dropdown menu
- Sign out functionality
- Role badge (owner/admin/member)

**Client Component**: Yes (dropdown state, sign out action)

**Styling**:
- Background: `bg-white/95 backdrop-blur-[10px]`
- Border: `border-b border-[#E4E4E7]`
- Height: `h-16`

---

### Dashboard Home (`/app/dashboard/page.tsx`)

**Purpose**: Overview of CRM data with stats and quick actions.

**Features**:
- 4 stat cards:
  - Total customers
  - New this week
  - In negotiation
  - Activity this week
- Quick action buttons:
  - Add customer
  - Import data
  - Enrich data
- Status breakdown chart
- Recent activity feed
- Empty state for new users

**Server Component**: Yes (fetches dashboard stats)

**Data Sources**:
- `getDashboardStats()` - Aggregate statistics
- `getRecentActivity()` - Last 10 activities

**Styling**:
- Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Card style: `bg-white border border-[#E4E4E7] rounded-2xl p-6`
- Spacious gaps: `gap-6` and `gap-8`

---

### Customer List (`/app/dashboard/customers/page.tsx`)

**Purpose**: Browse and manage customers.

**Features**:
- Search bar (name, email, phone, company)
- Filter panel (status, assigned to, missing data)
- Desktop: Table view
- Mobile: Card view
- Pagination (20 items per page)
- Add customer button
- Empty state

**Server Component**: Yes (fetches customer list)

**Data Sources**:
- `getCustomers()` - Paginated customer list with filters

**URL Parameters**:
- `page` - Current page number
- `search` - Search query
- `status` - Comma-separated status filters

---

### CustomerList Component (`/components/customers/CustomerList.tsx`)

**Purpose**: Renders customer list with search/filter UI.

**Features**:
- Search form with debouncing
- Filter toggle
- Table view (desktop):
  - Columns: Name, Company, Contact, Status, Assigned, Last Contact, Actions
  - Sortable headers
  - Row click to view detail
- Card view (mobile):
  - Compact layout
  - Swipe-friendly
- Pagination controls
- Empty state with CTA

**Client Component**: Yes (search state, filter state, navigation)

**Styling**:
- Table: `bg-white border border-[#E4E4E7] rounded-2xl`
- Header: `bg-[#FAFAFA]`
- Hover: `hover:bg-[#FAFAFA]`
- Mobile cards: `rounded-2xl p-4`

---

### CustomerStatusBadge (`/components/customers/CustomerStatusBadge.tsx`)

**Purpose**: Displays customer status with color coding.

**Status Colors**:
- リード (Lead): Gray `bg-[#F4F4F5] text-[#71717B]`
- 商談中 (Negotiation): Blue `bg-blue-50 text-blue-700`
- 契約 (Contract): Green `bg-green-50 text-green-700`
- 運用中 (Active): Purple `bg-purple-50 text-purple-700`
- 休眠 (Dormant): Gray `bg-gray-100 text-gray-600`

**Styling**:
- Pill shape: `rounded-full`
- Compact: `px-3 py-1 text-xs`

---

### AddCustomerModal (`/components/customers/AddCustomerModal.tsx`)

**Purpose**: Modal form for creating new customers.

**Features**:
- Full-screen modal on mobile
- Form fields:
  - Required: Name
  - Optional: Furigana, Email, Phone, Company, Address, Industry, Employee Count, Status, Assigned To, Notes
- Real-time duplicate detection (on name blur)
- Email validation
- Domain extraction from email
- Activity log creation
- Error handling

**Client Component**: Yes (form state, submission)

**Duplicate Detection**:
- Fuzzy name match using `find_similar_customers()`
- Exact email match
- Shows warning with similar customers

**Styling**:
- Modal: `fixed inset-0 bg-black/50`
- Content: `bg-white rounded-2xl max-w-2xl`
- Form: `space-y-6`
- Inputs: `rounded-xl border-[#E4E4E7]`

---

## Data Services

### customerService.ts (`/lib/services/customerService.ts`)

**Purpose**: Business logic for customer operations.

**Functions**:

#### `getDashboardStats(organizationId)`
Returns aggregate statistics for dashboard.

**Returns**:
```typescript
{
  totalCustomers: number
  newThisWeek: number
  inNegotiation: number
  activityThisWeek: number
  statusBreakdown: { status: string; count: number }[]
}
```

#### `getRecentActivity(organizationId, limit)`
Returns recent customer activities.

#### `getCustomers(organizationId, filters, pagination)`
Returns paginated customer list with filters.

**Filters**:
- search: Text search across name, email, phone, company
- status: Array of status values
- assignedTo: User ID
- lastContactFrom/To: Date range
- missingEmail/Phone/Address: Boolean flags
- createdFrom/To: Date range

**Returns**:
```typescript
{
  customers: Customer[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
```

#### `getCustomer(customerId, organizationId)`
Returns single customer with activity log.

#### `createCustomer(data, userId)`
Creates new customer and logs activity.

**Features**:
- Extracts domain from email
- Sets created_by
- Logs 'created' activity

#### `updateCustomer(customerId, organizationId, data, userId)`
Updates customer and logs activity.

**Features**:
- Tracks changes (before/after)
- Detects status changes
- Logs appropriate activity type

#### `deleteCustomer(customerId, organizationId, deleteActivityLog)`
Deletes customer and optionally activity log.

#### `findDuplicates(organizationId, name, email)`
Finds potential duplicate customers.

**Methods**:
- Exact email match
- Fuzzy name match (trigram similarity > 0.7)

**Returns**:
```typescript
Array<{
  ...Customer
  matchReason: string
  matchScore: number
}>
```

---

## Responsive Design

### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Optimizations

1. **Navigation**:
   - Sidebar → Bottom navigation bar
   - Icons + short labels

2. **Layout**:
   - Single column grids
   - Reduced padding: `px-6` instead of `px-48`

3. **Tables**:
   - Table → Card view
   - Horizontal scroll disabled
   - Touch-friendly tap targets (min 44x44px)

4. **Modals**:
   - Full-screen on mobile
   - Scrollable content
   - Sticky header

5. **Forms**:
   - Stacked fields
   - Larger inputs
   - Bottom padding for keyboard

---

## Performance Optimizations

### Server Components

- Dashboard stats fetched on server
- Customer list fetched on server
- No client-side data fetching for initial load

### Client Components

- Only interactive parts are client components
- Search/filter state managed client-side
- Optimistic UI updates (future)

### Database Queries

- Indexed columns for fast lookups
- RLS policies for automatic filtering
- Pagination to limit result sets
- Select only needed columns

### Caching

- Next.js automatic caching for Server Components
- Revalidation on mutations (router.refresh())

---

## Error Handling

### Authentication

- Redirect to login if not authenticated
- Check organization membership
- Handle missing user profile

### Data Fetching

- Try-catch blocks in service functions
- Error messages displayed in UI
- Fallback to empty states

### Form Validation

- Required field checks
- Email format validation
- Phone number formatting
- Duplicate warnings (non-blocking)

---

## Future Enhancements

### Phase 4: Import
- [ ] Excel/CSV upload
- [ ] Column mapping
- [ ] Batch import with progress

### Phase 5: Customer Detail
- [ ] Full customer profile page
- [ ] Activity timeline
- [ ] Edit inline
- [ ] Enrichment button

### Phase 6: Deduplication
- [ ] Duplicate review page
- [ ] Merge interface
- [ ] Undo merge

### Phase 7: Status Board
- [ ] Kanban view
- [ ] Drag-and-drop
- [ ] Status customization

### Phase 8: Settings
- [ ] Organization settings
- [ ] User management
- [ ] Custom fields
- [ ] Integrations

---

## Testing Checklist

- [ ] Authentication flow
- [ ] Dashboard stats accuracy
- [ ] Customer list pagination
- [ ] Search functionality
- [ ] Filter functionality
- [ ] Add customer form
- [ ] Duplicate detection
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] RLS policies
