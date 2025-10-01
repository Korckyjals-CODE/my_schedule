# Test 5.2 Refactoring Prompt - User Data Isolation

## Purpose

This document provides a comprehensive prompt for an AI Agent to refactor the Schedule Editor application to fix user data isolation issues identified by Test 5.2. Use this prompt when the test reveals that users can see or modify other users' data.

---

## Context for AI Agent

You are tasked with fixing user data isolation issues in a Schedule Editor application. Test 5.2 has identified that data is not properly isolated between users, meaning:

- Users can see other users' schedule data
- Users may be able to edit or delete other users' schedules
- Row Level Security (RLS) policies are missing or improperly configured
- Database queries do not properly filter by user_id

## Test Results Summary

**Test:** Test 5.2 - User Data Isolation  
**Status:** FAILED  
**Critical Issues Found:**
1. Users can view schedules belonging to other users
2. Row Level Security (RLS) policies are not properly configured
3. Database queries may not be filtering by user_id
4. Edit/delete operations may affect other users' data

**Security Severity:** 🔴 CRITICAL

---

## Refactoring Tasks

### Task 1: Enable Row Level Security on Schedules Table

**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 15 minutes

#### Problem

The `schedules` table does not have Row Level Security (RLS) enabled, allowing users to access all rows regardless of ownership.

#### Solution

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security on the schedules table
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
```

#### Verification

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'schedules';

-- Expected result: rowsecurity = true
```

#### Impact

- **Security:** HIGH - Prevents unauthorized data access
- **Performance:** NONE - Minimal performance impact
- **Breaking Changes:** NONE - Existing authenticated users continue to work

---

### Task 2: Create SELECT Policy for User Data Isolation

**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 10 minutes

#### Problem

Users can SELECT (view) all schedules in the database, including those belonging to other users.

#### Solution

Create a policy that allows users to only SELECT their own schedules:

```sql
-- Policy: Users can only view their own schedules
CREATE POLICY "Users can view own schedules"
ON schedules
FOR SELECT
USING (auth.uid() = user_id);
```

#### Explanation

- `auth.uid()` - Returns the UUID of the currently authenticated user
- `user_id` - Column in schedules table that stores the owner's UUID
- `USING` clause - Filters rows to only those where user_id matches the authenticated user

#### Verification

1. Login as User A and create a schedule
2. Login as User B
3. Try to view schedules - should see none from User A
4. Create a schedule as User B - should only see own schedule

```sql
-- Test query (as User A)
SELECT * FROM schedules;
-- Should only return schedules where user_id = User A's UUID
```

#### Impact

- **Security:** HIGH - Users can only view their own data
- **Functionality:** NONE - Users retain access to their schedules
- **Breaking Changes:** YES - If app was relying on viewing all users' data

---

### Task 3: Create INSERT Policy for User Data Isolation

**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 10 minutes

#### Problem

Users may be able to insert schedules with any user_id, potentially creating schedules for other users.

#### Solution

Create a policy that ensures users can only create schedules for themselves:

```sql
-- Policy: Users can only insert their own schedules
CREATE POLICY "Users can insert own schedules"
ON schedules
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### Explanation

- `WITH CHECK` - Validates the data being inserted
- Ensures `user_id` in the new row matches the authenticated user
- Prevents users from spoofing other users' IDs

#### Verification

```sql
-- This should succeed (inserting with own user_id)
INSERT INTO schedules (user_id, weekday, grade, start_time, end_time, subject)
VALUES (auth.uid(), 'Monday', '6A', '08:00', '08:45', 'Math');

-- This should FAIL (trying to insert with different user_id)
INSERT INTO schedules (user_id, weekday, grade, start_time, end_time, subject)
VALUES ('00000000-0000-0000-0000-000000000000', 'Monday', '6A', '08:00', '08:45', 'Math');
-- Error: new row violates row-level security policy
```

#### Impact

- **Security:** HIGH - Prevents users from creating data for others
- **Functionality:** NONE - Legitimate inserts continue to work
- **Breaking Changes:** YES - If app was inserting with incorrect user_id

---

### Task 4: Create UPDATE Policy for User Data Isolation

**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 10 minutes

#### Problem

Users may be able to update schedules belonging to other users.

#### Solution

Create a policy that allows users to only update their own schedules:

```sql
-- Policy: Users can only update their own schedules
CREATE POLICY "Users can update own schedules"
ON schedules
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### Explanation

- `USING` - Filters which existing rows can be updated
- `WITH CHECK` - Validates the updated data
- Both clauses ensure the user_id remains the authenticated user's ID

#### Verification

```sql
-- As User A: This should succeed (updating own schedule)
UPDATE schedules 
SET subject = 'Math Advanced'
WHERE user_id = auth.uid() AND id = 'some-schedule-id';

-- As User A: This should FAIL (trying to update User B's schedule)
UPDATE schedules 
SET subject = 'Hacked!'
WHERE user_id != auth.uid();
-- Affected rows: 0 (policy prevented access)
```

#### Impact

- **Security:** HIGH - Prevents unauthorized data modification
- **Functionality:** NONE - Users can still update their own data
- **Breaking Changes:** YES - If app allowed editing other users' data

---

### Task 5: Create DELETE Policy for User Data Isolation

**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 10 minutes

#### Problem

Users may be able to delete schedules belonging to other users.

#### Solution

Create a policy that allows users to only delete their own schedules:

```sql
-- Policy: Users can only delete their own schedules
CREATE POLICY "Users can delete own schedules"
ON schedules
FOR DELETE
USING (auth.uid() = user_id);
```

#### Explanation

- `USING` - Filters which rows can be deleted
- Only rows where user_id matches the authenticated user can be deleted

#### Verification

```sql
-- As User A: This should succeed (deleting own schedule)
DELETE FROM schedules 
WHERE user_id = auth.uid() AND id = 'some-schedule-id';

-- As User A: This should FAIL (trying to delete User B's schedule)
DELETE FROM schedules 
WHERE user_id != auth.uid();
-- Affected rows: 0 (policy prevented access)
```

#### Impact

- **Security:** HIGH - Prevents unauthorized data deletion
- **Functionality:** NONE - Users can still delete their own data
- **Breaking Changes:** YES - If app allowed deleting other users' data

---

### Task 6: Verify user_id is Set Correctly in Backend

**Priority:** 🔴 CRITICAL  
**Estimated Effort:** 30 minutes

#### Problem

The backend may not be properly setting `user_id` when creating schedules, or may be using client-provided user_id values instead of the authenticated user's ID.

#### Solution: Review and Fix Server-Side Code

**File:** `src/server.js`

#### Current Code (Potentially Insecure)

```javascript
// ❌ INSECURE: Using user_id from request body
app.post('/api/schedule', async (req, res) => {
    const { user_id, weekday, grade, start_time, end_time, subject } = req.body;
    
    // Insert with client-provided user_id - SECURITY RISK!
    const { data, error } = await supabase
        .from('schedules')
        .insert({ user_id, weekday, grade, start_time, end_time, subject });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});
```

#### Secure Code (Fixed)

```javascript
// ✅ SECURE: Using authenticated user's ID from JWT
app.post('/api/schedule', async (req, res) => {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and get user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get schedule data from request body (but NOT user_id)
    const { weekday, grade, start_time, end_time, subject } = req.body;
    
    // Insert with authenticated user's ID (from JWT, not client)
    const { data, error } = await supabase
        .from('schedules')
        .insert({ 
            user_id: user.id,  // ✅ From authenticated user
            weekday, 
            grade, 
            start_time, 
            end_time, 
            subject 
        });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});
```

#### Apply Same Fix to Other Endpoints

1. **GET /api/schedule** - Use authenticated user ID for filtering
2. **PUT /api/schedule/:id** - Verify user owns the schedule
3. **DELETE /api/schedule/:id** - Verify user owns the schedule

#### Verification Steps

1. **Test creating a schedule:**
   ```bash
   curl -X POST http://localhost:3000/api/schedule \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "weekday": "Monday",
       "grade": "6A",
       "start_time": "08:00",
       "end_time": "08:45",
       "subject": "Math"
     }'
   ```

2. **Verify in database:**
   ```sql
   SELECT user_id, weekday, subject FROM schedules ORDER BY created_at DESC LIMIT 1;
   -- user_id should match the authenticated user's ID
   ```

3. **Try spoofing user_id (should fail):**
   ```bash
   curl -X POST http://localhost:3000/api/schedule \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "00000000-0000-0000-0000-000000000000",
       "weekday": "Monday",
       "grade": "6A",
       "start_time": "08:00",
       "end_time": "08:45",
       "subject": "Hacked"
     }'
   # Should use authenticated user's ID, not the provided one
   ```

#### Impact

- **Security:** CRITICAL - Prevents user ID spoofing
- **Functionality:** NONE - Legitimate requests continue to work
- **Breaking Changes:** YES - Client code must not send user_id

---

### Task 7: Create Authentication Middleware

**Priority:** 🟡 HIGH  
**Estimated Effort:** 45 minutes

#### Problem

Authentication logic is duplicated across multiple routes, making it error-prone and harder to maintain.

#### Solution: Create Reusable Middleware

**File:** `src/middleware/auth.js` (create new file)

```javascript
// src/middleware/auth.js
const { supabase } = require('../supabase');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
async function requireAuth(req, res, next) {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header'
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        // Verify token and get user
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }
        
        // Attach user to request object for use in routes
        req.user = user;
        req.userId = user.id;
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: 'Authentication failed'
        });
    }
}

module.exports = { requireAuth };
```

#### Update Routes to Use Middleware

**File:** `src/server.js`

```javascript
const { requireAuth } = require('./middleware/auth');

// Apply middleware to protected routes
app.post('/api/schedule', requireAuth, async (req, res) => {
    const { weekday, grade, start_time, end_time, subject } = req.body;
    
    // req.userId is now available from middleware
    const { data, error } = await supabase
        .from('schedules')
        .insert({ 
            user_id: req.userId,  // ✅ From middleware
            weekday, 
            grade, 
            start_time, 
            end_time, 
            subject 
        });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/schedule', requireAuth, async (req, res) => {
    // Filter by authenticated user's ID
    const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', req.userId);  // ✅ From middleware
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.put('/api/schedule/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { weekday, grade, start_time, end_time, subject } = req.body;
    
    // Update only if user owns the schedule (RLS will enforce this too)
    const { data, error } = await supabase
        .from('schedules')
        .update({ weekday, grade, start_time, end_time, subject })
        .eq('id', id)
        .eq('user_id', req.userId);  // ✅ Ensure user owns it
    
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Schedule not found or unauthorized' });
    }
    res.json(data);
});

app.delete('/api/schedule/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    // Delete only if user owns the schedule
    const { data, error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)
        .eq('user_id', req.userId);  // ✅ Ensure user owns it
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});
```

#### Verification

```bash
# Test without token (should fail)
curl -X GET http://localhost:3000/api/schedule
# Expected: 401 Unauthorized

# Test with invalid token (should fail)
curl -X GET http://localhost:3000/api/schedule \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized

# Test with valid token (should succeed)
curl -X GET http://localhost:3000/api/schedule \
  -H "Authorization: Bearer VALID_JWT_TOKEN"
# Expected: 200 OK with user's schedules
```

#### Impact

- **Security:** HIGH - Centralized auth logic reduces errors
- **Maintainability:** HIGH - DRY principle, easier to update
- **Performance:** NONE - Minimal overhead
- **Breaking Changes:** NONE - Behavior remains the same

---

### Task 8: Update Frontend to Send Proper Authentication

**Priority:** 🟡 HIGH  
**Estimated Effort:** 30 minutes

#### Problem

Frontend may not be sending authentication tokens with API requests, or may be sending user_id in request bodies.

#### Solution: Review and Fix Frontend Code

**File:** `public/js/editor.js`

#### Current Code (Potentially Insecure)

```javascript
// ❌ INSECURE: Sending user_id from frontend
async function saveSchedule() {
    const userId = localStorage.getItem('user_id');  // ❌ From localStorage
    
    const scheduleData = {
        user_id: userId,  // ❌ Client-provided
        weekday: document.getElementById('weekday').value,
        grade: document.getElementById('grade').value,
        start_time: document.getElementById('startTime').value,
        end_time: document.getElementById('endTime').value,
        subject: document.getElementById('subject').value
    };
    
    // ❌ No authentication header
    const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
    });
}
```

#### Secure Code (Fixed)

```javascript
// ✅ SECURE: Using JWT token, not sending user_id
async function saveSchedule() {
    // Get JWT token from Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        alert('Please login to save schedules');
        window.location.href = '/';
        return;
    }
    
    const scheduleData = {
        // ❌ DO NOT send user_id - backend will use authenticated user
        weekday: document.getElementById('weekday').value,
        grade: document.getElementById('grade').value,
        start_time: document.getElementById('startTime').value,
        end_time: document.getElementById('endTime').value,
        subject: document.getElementById('subject').value
    };
    
    // ✅ Include JWT token in Authorization header
    const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`  // ✅ JWT token
        },
        body: JSON.stringify(scheduleData)
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            alert('Session expired. Please login again.');
            window.location.href = '/';
            return;
        }
        throw new Error('Failed to save schedule');
    }
    
    const result = await response.json();
    console.log('Schedule saved:', result);
}
```

#### Apply Same Fix to Other API Calls

**Files to Update:**
- `public/js/editor.js` - All API calls
- `public/js/script.js` - Schedule fetching
- `public/js/search.js` - Search API calls

**Pattern to Follow:**

```javascript
// Helper function to make authenticated API calls
async function authenticatedFetch(url, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        throw new Error('Not authenticated');
    }
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${session.access_token}`
    };
    
    return fetch(url, { ...options, headers });
}

// Usage
const response = await authenticatedFetch('/api/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scheduleData)
});
```

#### Verification

1. **Check browser DevTools Network tab:**
   - Look for Authorization header in requests
   - Verify it contains: `Bearer eyJhbGc...`

2. **Test creating a schedule:**
   - Create schedule in UI
   - Check Network tab for POST request
   - Verify Authorization header is present

3. **Test with expired token:**
   - Clear session storage
   - Try to create schedule
   - Should redirect to login

#### Impact

- **Security:** HIGH - Proper authentication on all requests
- **User Experience:** MINOR - May see more login prompts
- **Breaking Changes:** NONE - Users just need to be logged in

---

### Task 9: Add Database Constraints

**Priority:** 🟢 MEDIUM  
**Estimated Effort:** 15 minutes

#### Problem

Database may allow NULL user_id values or invalid UUID formats.

#### Solution: Add Database Constraints

```sql
-- Ensure user_id is NOT NULL
ALTER TABLE schedules 
ALTER COLUMN user_id SET NOT NULL;

-- Ensure user_id is a valid UUID
ALTER TABLE schedules
ADD CONSTRAINT schedules_user_id_check 
CHECK (user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Add foreign key constraint (optional but recommended)
ALTER TABLE schedules
ADD CONSTRAINT schedules_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

#### Explanation

- **NOT NULL:** Prevents creating schedules without a user
- **UUID Format:** Validates user_id is a proper UUID
- **Foreign Key:** Ensures user_id references actual user; CASCADE deletes schedules when user is deleted

#### Verification

```sql
-- This should FAIL (NULL user_id)
INSERT INTO schedules (user_id, weekday) VALUES (NULL, 'Monday');
-- Error: null value in column "user_id" violates not-null constraint

-- This should FAIL (invalid UUID)
INSERT INTO schedules (user_id, weekday) VALUES ('invalid', 'Monday');
-- Error: new row violates check constraint "schedules_user_id_check"

-- This should FAIL (non-existent user)
INSERT INTO schedules (user_id, weekday) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Monday');
-- Error: insert or update on table "schedules" violates foreign key constraint
```

#### Impact

- **Data Integrity:** HIGH - Ensures valid data
- **Security:** MEDIUM - Additional validation layer
- **Breaking Changes:** YES - If system was creating invalid data

---

### Task 10: Add Logging and Monitoring

**Priority:** 🟢 MEDIUM  
**Estimated Effort:** 30 minutes

#### Problem

No visibility into potential security issues or unauthorized access attempts.

#### Solution: Add Logging

**File:** `src/middleware/auth.js`

```javascript
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Log unauthorized attempt
            console.warn('Unauthorized access attempt:', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            });
            
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header'
            });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            // Log invalid token attempt
            console.warn('Invalid token attempt:', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                error: error?.message,
                timestamp: new Date().toISOString()
            });
            
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }
        
        // Log successful authentication
        console.info('Authenticated request:', {
            userId: user.id,
            email: user.email,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });
        
        req.user = user;
        req.userId = user.id;
        next();
    } catch (error) {
        console.error('Authentication error:', {
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString()
        });
        
        return res.status(500).json({ 
            error: 'Internal server error',
            message: 'Authentication failed'
        });
    }
}
```

#### Add Monitoring for Data Access

**File:** `src/server.js`

```javascript
app.get('/api/schedule', requireAuth, async (req, res) => {
    const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', req.userId);
    
    if (error) {
        console.error('Schedule fetch error:', {
            userId: req.userId,
            error: error.message,
            timestamp: new Date().toISOString()
        });
        return res.status(500).json({ error: error.message });
    }
    
    console.info('Schedule fetched:', {
        userId: req.userId,
        count: data.length,
        timestamp: new Date().toISOString()
    });
    
    res.json(data);
});
```

#### Impact

- **Security:** MEDIUM - Detect unauthorized access attempts
- **Debugging:** HIGH - Easier to troubleshoot issues
- **Performance:** LOW - Minimal logging overhead
- **Breaking Changes:** NONE

---

## Complete Implementation Checklist

### Critical Tasks (Must Complete)

- [ ] Task 1: Enable RLS on schedules table
- [ ] Task 2: Create SELECT policy
- [ ] Task 3: Create INSERT policy
- [ ] Task 4: CREATE UPDATE policy
- [ ] Task 5: Create DELETE policy
- [ ] Task 6: Fix backend user_id handling
- [ ] Test isolation with Test 5.2

### High Priority Tasks (Strongly Recommended)

- [ ] Task 7: Create authentication middleware
- [ ] Task 8: Update frontend authentication
- [ ] Re-test with Test 5.2
- [ ] Manual testing with two users

### Medium Priority Tasks (Recommended)

- [ ] Task 9: Add database constraints
- [ ] Task 10: Add logging and monitoring
- [ ] Update documentation
- [ ] Review code with security focus

---

## Testing After Refactoring

### Step 1: Run Automated Test

```bash
# Ensure server is running
npm start

# Run Test 5.2
cd tests/group_5
node test_5_2_user_data_isolation.js
```

**Expected Result:** ✅ All steps PASS

### Step 2: Manual Verification

1. Open two browsers (or regular + incognito)
2. Login as different users in each
3. Create schedules in each
4. Verify no cross-contamination
5. Test edit/delete operations

### Step 3: Database Verification

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'schedules';

-- View policies
SELECT * FROM pg_policies WHERE tablename = 'schedules';

-- Check data integrity
SELECT user_id, COUNT(*) FROM schedules GROUP BY user_id;
```

---

## Success Criteria

Refactoring is successful when:

✅ Test 5.2 passes completely (all steps PASS)  
✅ Users can only see their own schedules  
✅ Users cannot modify other users' data  
✅ RLS policies are properly configured  
✅ Backend enforces authentication  
✅ Frontend sends proper JWT tokens  
✅ No security warnings in logs  

---

## Rollback Plan

If refactoring causes issues:

### Quick Rollback

```sql
-- Disable RLS (temporary, for debugging only)
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** This removes all data isolation! Only use for debugging.

### Proper Fix

1. Review error logs
2. Check which policy is causing issues
3. Adjust policy or fix application code
4. Re-enable RLS and test again

---

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT Authentication Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

**Document Version:** 1.0  
**Last Updated:** October 1, 2025  
**Priority Level:** 🔴 CRITICAL  
**Estimated Total Effort:** 3-4 hours  
**Security Impact:** HIGH

