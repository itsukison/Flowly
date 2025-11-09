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

**Status**: COMPLETED ✅

**Completed**: 2025-11-09
