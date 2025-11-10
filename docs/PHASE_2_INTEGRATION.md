# Phase 2: Multi-Organization Support - Integration Guide

## Overview
Phase 2 adds multi-organization support, allowing users to belong to multiple organizations and switch between them.

## Database Changes

### New Table: `user_organizations`
Junction table linking users to multiple organizations with roles.

### Schema Changes
- `users.organization_id` → `users.current_organization_id`
- All RLS policies updated to use `user_organizations` table

### New Functions
- `get_user_organizations()` - Returns all organizations for current user
- `switch_organization(org_id)` - Switches user's current organization

## Frontend Integration

### 1. Wrap your app with OrganizationProvider

```tsx
// app/layout.tsx or app/dashboard/layout.tsx
import { OrganizationProvider } from '@/contexts/OrganizationContext'

export default function Layout({ children }) {
  return (
    <OrganizationProvider>
      {children}
    </OrganizationProvider>
  )
}
```

### 2. Add OrganizationSwitcher to your header

```tsx
// components/Header.tsx
import OrganizationSwitcher from '@/components/OrganizationSwitcher'

export default function Header() {
  return (
    <header>
      {/* Other header content */}
      <OrganizationSwitcher />
    </header>
  )
}
```

### 3. Use the organization context in your components

```tsx
import { useOrganization } from '@/contexts/OrganizationContext'

export default function MyComponent() {
  const { currentOrganization, organizations, switchOrganization } = useOrganization()
  
  // Use currentOrganization.id for queries
  // Use organizations to show list
  // Call switchOrganization(orgId) to switch
}
```

## Query Updates

All queries now automatically filter by organization through RLS policies. No code changes needed for existing queries!

The RLS policies use `user_organizations` table to determine access:

```sql
-- Example: Users can only see customers in their organizations
CREATE POLICY "Users can view customers in their organizations" ON customers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );
```

## Testing

1. Verify user can see their organizations:
```sql
SELECT * FROM get_user_organizations();
```

2. Switch organization:
```sql
SELECT switch_organization('org-uuid-here');
```

3. Check current organization:
```sql
SELECT current_organization_id FROM users WHERE id = auth.uid();
```

## Next Steps

- Implement organization creation UI
- Add organization settings page
- Add member management (invite/remove users)
- Add organization deletion with confirmation

## Notes

- Switching organizations triggers a page reload to refresh all data
- Users must belong to at least one organization
- The first organization is set as default if no current_organization_id is set
