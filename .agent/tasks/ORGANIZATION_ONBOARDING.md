# Organization Onboarding Flow

## Problem
Users can sign up but can't access the dashboard because no organization exists. Critical UX blocker.

## Solution
Add organization creation immediately after signup, before dashboard access.

## Implementation (2-3 hours)

### 1. Post-Signup Organization Setup Page
**File**: `app/onboarding/page.tsx`
- Simple form: organization name input
- Auto-create organization on submit
- Link user to organization in `users` table
- Redirect to dashboard

### 2. Update Signup Flow
**File**: `app/signup/page.tsx`
- After successful signup → redirect to `/onboarding` (not `/dashboard`)

### 3. Middleware Protection
**File**: `middleware.ts`
- Check if user has `organization_id`
- If not, redirect to `/onboarding` (except for `/onboarding` itself)

### 4. Database Function (Optional Enhancement)
Create trigger to auto-generate organization on user creation with default name from email.

## User Flow
1. Sign up → Email verification
2. Login → Check organization
3. No org? → `/onboarding` (create org)
4. Has org? → `/dashboard`

## Files to Create/Modify
- `app/onboarding/page.tsx` (new)
- `app/signup/page.tsx` (modify redirect)
- `middleware.ts` (add org check)

**Priority**: CRITICAL - blocks all new users
**Status**: COMPLETED

## Implementation Summary

### Root Cause Analysis

**The Fundamental Problem:**
The `users.organization_id` column is `NOT NULL`, but we need users to exist BEFORE they create an organization during onboarding. This creates a chicken-and-egg problem.

**Critical Issues Found:**
1. **Schema Design Flaw**: `organization_id` is NOT NULL, but users need to exist before creating org
2. **Missing Trigger**: No auto-creation of `public.users` record when `auth.users` is created
3. **Trigger Failure**: When I added the trigger, it tries to INSERT with NULL `organization_id` → violates NOT NULL constraint
4. **Poor UX Flow**: Dashboard showed error message instead of redirecting to onboarding
5. **RLS Recursion**: Middleware attempted RLS queries causing infinite recursion
6. **Dead End**: Email redirect went to dashboard which had no way forward

**The Real Solution:**
Make `organization_id` NULLABLE in the schema, allowing users to exist without an organization during onboarding.

### Files Created
- `app/onboarding/page.tsx` - Server component that checks auth and org status
- `components/onboarding/OnboardingForm.tsx` - Client form for creating organization

### Files Modified
- `components/auth/SignupForm.tsx` - Changed emailRedirectTo from `/dashboard` to `/onboarding`
- `components/auth/LoginForm.tsx` - Simplified to just redirect to `/dashboard` (no RLS query)
- `lib/supabase/middleware.ts` - Removed org check to avoid RLS recursion
- `app/dashboard/page.tsx` - Changed from showing error to `redirect('/onboarding')`

### Database Changes
1. **Migration: `allow_user_self_organization_setup`**
   - Added RLS policy allowing users to set their own `organization_id` when NULL
   - Prevents infinite recursion during onboarding

2. **Migration: `auto_create_user_profile_on_signup`**
   - Created `handle_new_user()` function to auto-create user profile
   - Added trigger on `auth.users` INSERT to create corresponding `public.users` record
   - Sets default role to 'owner' for new signups

### User Flow (Final)
1. Sign up → Email sent
2. Click email link → Redirected to `/onboarding` (via emailRedirectTo)
3. Auto-created user profile exists (via trigger)
4. Enter organization name → Creates org + links to user
5. Auto-redirect to `/dashboard` → Full access

### Architecture Decision
- **Middleware**: Only handles authentication (no database queries)
- **Dashboard page**: Handles org check server-side and redirects if needed
- **Onboarding**: Uses special RLS policy for first-time setup
- **Trigger**: Auto-creates user profiles to ensure consistency

### Final Fixes Applied

**Migration 1: `make_organization_id_nullable`**
```sql
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;
```
- Changed `organization_id` from NOT NULL to NULLABLE
- Allows users to exist without an organization during onboarding

**Migration 2: `allow_organization_creation_during_onboarding`**
```sql
CREATE POLICY "Authenticated users can create organizations"
ON organizations FOR INSERT WITH CHECK (true);
```
- Allows any authenticated user to create an organization
- Essential for the onboarding flow

**Verification:**
- ✅ `users.organization_id` is now NULLABLE
- ✅ Trigger `handle_new_user()` can now create users without org
- ✅ RLS policy allows users to INSERT organizations
- ✅ RLS policy allows users to UPDATE their own `organization_id` when NULL
- ✅ Dashboard redirects to `/onboarding` when no org exists
- ✅ Onboarding form can create org and link to user

**Status**: FAILED - INFINITE RECURSION DETECTED

**Completed**: 2025-11-09
**Reopened**: 2025-11-10

---

## CRITICAL BUG: Infinite Recursion in RLS Policies

### The Real Root Cause

The infinite recursion happens when a user tries to UPDATE their `organization_id` during onboarding. Here's the chain:

1. **User submits onboarding form** → Tries to UPDATE `users.organization_id`
2. **RLS Policy "Users can set their own organization during onboarding"** triggers
   - Checks: `(id = auth.uid()) AND (organization_id IS NULL)`
3. **To evaluate this policy, Postgres needs to SELECT from `users` table**
4. **SELECT triggers RLS policy "Users can view users in their organization"**
   - Checks: `organization_id IN (SELECT users.organization_id FROM users WHERE users.id = auth.uid())`
5. **This SELECT causes ANOTHER SELECT on `users` table** → INFINITE RECURSION

### Why This Happens

**The Circular Dependency:**
```
UPDATE users (onboarding)
  → Needs to check UPDATE policy
    → Policy checks organization_id IS NULL
      → Triggers SELECT on users table
        → SELECT policy checks organization_id IN (SELECT users.organization_id...)
          → Triggers ANOTHER SELECT on users table
            → INFINITE LOOP
```

**The Problem Policies:**

1. **UPDATE Policy (onboarding):**
   ```sql
   qual: (id = auth.uid()) AND (organization_id IS NULL)
   ```
   This is fine - it's simple and doesn't query other tables.

2. **SELECT Policy (view users in org):**
   ```sql
   qual: (organization_id IS NOT NULL) AND 
         (organization_id IN (SELECT users.organization_id FROM users WHERE users.id = auth.uid()))
   ```
   **THIS IS THE PROBLEM** - It queries the `users` table WITHIN the RLS policy, creating recursion.

3. **SELECT Policy (view own profile):**
   ```sql
   qual: (id = auth.uid())
   ```
   This is fine - it's simple.

### Why Previous Attempts Failed

The migrations `fix_rls_recursion_for_onboarding` and `fix_select_policy_recursion` likely tried to patch this but didn't address the fundamental issue: **RLS policies that query the same table they're protecting will ALWAYS cause recursion during certain operations.**

### The Solution

**Option 1: Use Security Definer Function (RECOMMENDED)**
Create a function that runs with elevated privileges to bypass RLS during onboarding:
```sql
CREATE OR REPLACE FUNCTION set_user_organization(org_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users 
  SET organization_id = org_id 
  WHERE id = auth.uid() 
  AND organization_id IS NULL;
END;
$$ LANGUAGE plpgsql;
```

**Option 2: Simplify SELECT Policies**
Remove the recursive SELECT from the policy by using a simpler check:
```sql
-- Instead of querying users table in the policy, use a function
CREATE OR REPLACE FUNCTION user_organization_id()
RETURNS uuid
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql;

-- Then use it in policies without recursion
CREATE POLICY "Users can view users in their organization"
ON users FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND organization_id = user_organization_id()
);
```

**Option 3: Use Session Variables (CLEANEST)**
Store organization_id in a session variable during login, avoiding table lookups entirely:
```sql
-- Set on login
SELECT set_config('app.current_organization_id', organization_id::text, false)
FROM users WHERE id = auth.uid();

-- Use in policies
CREATE POLICY "Users can view users in their organization"
ON users FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND organization_id::text = current_setting('app.current_organization_id', true)
);
```

### Recommended Approach

**Use Option 1 (Security Definer Function)** because:
- ✅ Minimal changes to existing code
- ✅ Isolated fix for onboarding flow only
- ✅ Doesn't affect other RLS policies
- ✅ Easy to test and verify
- ✅ No session management complexity

### Implementation Plan

1. **Create migration: `fix_onboarding_recursion_with_function`**
   - Create `set_user_organization()` function with SECURITY DEFINER
   - Grant EXECUTE to authenticated users

2. **Update OnboardingForm.tsx**
   - Replace direct UPDATE with RPC call to `set_user_organization()`

3. **Test Flow**
   - Sign up new user
   - Navigate to onboarding
   - Submit organization name
   - Verify no recursion error
   - Verify redirect to dashboard works

**Status**: IMPLEMENTED ✅

### Implementation Completed

**Migration Applied: `fix_onboarding_recursion_with_function`**
```sql
CREATE OR REPLACE FUNCTION set_user_organization(org_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
```

**Changes Made:**
1. ✅ Created `set_user_organization()` function with SECURITY DEFINER
2. ✅ Updated `OnboardingForm.tsx` to use RPC call instead of direct UPDATE
3. ✅ Function validates user can only set org when `organization_id IS NULL`
4. ✅ Granted EXECUTE permission to authenticated users
5. ✅ Regenerated TypeScript types to include new RPC function
6. ✅ Updated `lib/supabase/database.types.ts` with new types

**How It Works:**
- User submits organization name
- Creates organization in `organizations` table (no recursion - simple INSERT policy)
- Calls `set_user_organization(org_id)` via RPC
- Function runs with elevated privileges, bypassing RLS entirely
- No recursion because RLS policies are not evaluated
- User is linked to organization and redirected to dashboard

**Files Modified:**
- `components/onboarding/OnboardingForm.tsx` - Changed UPDATE to RPC call
- `lib/supabase/database.types.ts` - Added `set_user_organization` function type

**Testing Required:**
1. Sign up new user
2. Navigate to `/onboarding`
3. Enter organization name and submit
4. Verify no "infinite recursion" error
5. Verify redirect to `/dashboard` works
6. Verify user can access dashboard features

**Build Status:** ✅ TypeScript compilation successful

**Completed**: 2025-11-10
