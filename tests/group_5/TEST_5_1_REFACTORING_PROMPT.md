# Test 5.1: Schedule Data Persistence - Refactoring Prompt

## Context
This refactoring prompt provides guidance for an AI Agent to fix issues identified during Test 5.1: Schedule Data Persistence testing. The test validates that schedule data persists correctly across page refreshes, user sessions, and CRUD operations. This document should be used when the test identifies failures or issues with data persistence functionality.

## Test Overview
- **Test Name:** Test 5.1: Schedule Data Persistence
- **Test File:** `tests/group_5/test_5_1_schedule_data_persistence.js`
- **Target Functionality:** Data persistence across various application states
- **Critical Components:** Database operations, session management, localStorage, API endpoints

## Common Failure Scenarios and Solutions

### 1. Data Not Persisting After Page Refresh

#### Symptoms
- Schedule data disappears after page reload
- localStorage appears empty or incorrect
- Database queries return no data
- "Data mismatch after page refresh" error

#### Root Causes
1. **localStorage not being saved correctly**
2. **Database save operations not completing**
3. **API calls failing silently**
4. **Race conditions in save operations**

#### Refactoring Tasks

##### Task 1.1: Ensure Proper Save Operations

```javascript
// In public/js/editor.js or public/js/script.js
// Current approach may not wait for save completion

// BEFORE (Potentially problematic):
async function saveWeekdaySchedule() {
    const scheduleData = collectScheduleData();
    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
    await saveToDatabase(scheduleData); // May not complete before navigation
}

// AFTER (Improved):
async function saveWeekdaySchedule() {
    try {
        // Show loading indicator
        showLoadingIndicator('Saving schedule...');
        
        // Collect schedule data
        const scheduleData = collectScheduleData();
        
        // Save to localStorage first (for immediate feedback)
        localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
        
        // Ensure database save completes
        const saveResult = await saveToDatabase(scheduleData);
        
        if (!saveResult || !saveResult.success) {
            throw new Error('Database save failed');
        }
        
        // Verify data was saved
        const verifyResult = await verifyDatabaseSave(scheduleData);
        
        if (!verifyResult) {
            throw new Error('Data verification failed');
        }
        
        // Show success message
        showSuccessMessage('Schedule saved successfully');
        
        // Return confirmation
        return { success: true, data: scheduleData };
        
    } catch (error) {
        console.error('Save failed:', error);
        showErrorMessage('Failed to save schedule: ' + error.message);
        
        // Attempt rollback if needed
        await rollbackPartialSave();
        
        return { success: false, error: error.message };
    } finally {
        hideLoadingIndicator();
    }
}

// Add verification function
async function verifyDatabaseSave(expectedData) {
    try {
        const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', (await supabase.auth.getUser()).data.user.id);
        
        if (error) {
            console.error('Verification query failed:', error);
            return false;
        }
        
        // Verify data matches expectations
        return data && data.length > 0;
    } catch (error) {
        console.error('Verification failed:', error);
        return false;
    }
}
```

##### Task 1.2: Add Save Confirmation Mechanism

```javascript
// Add to editor.js or relevant save handler
async function saveToDatabase(scheduleData) {
    try {
        const user = await supabase.auth.getUser();
        if (!user || !user.data || !user.data.user) {
            throw new Error('User not authenticated');
        }
        
        const userId = user.data.user.id;
        
        // Use upsert to handle both insert and update
        const { data, error } = await supabase
            .from('schedules')
            .upsert({
                user_id: userId,
                schedule_data: scheduleData,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id',
                returning: 'representation'
            });
        
        if (error) {
            console.error('Database save error:', error);
            throw new Error(`Database error: ${error.message}`);
        }
        
        console.log('Data saved successfully:', data);
        
        // Wait for database to commit (small delay)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Save to database failed:', error);
        throw error;
    }
}
```

#### Implementation Steps
1. Add proper async/await handling for all save operations
2. Implement save verification after database operations
3. Add error handling with user feedback
4. Add loading indicators during save operations
5. Test save operations with network throttling

---

### 2. Session Persistence Failure (Logout/Login)

#### Symptoms
- Data disappears after logout/login cycle
- User sees empty schedule after re-authentication
- Different user data appears after login
- "Session persistence test failed" error

#### Root Causes
1. **Row Level Security (RLS) policies not configured correctly**
2. **User ID not being used in queries**
3. **Data being stored without user association**
4. **Session token not persisting correctly**

#### Refactoring Tasks

##### Task 2.1: Fix Row Level Security Policies

```sql
-- In database-schema.sql or via Supabase dashboard
-- Ensure RLS is enabled and policies are correct

-- Enable RLS on schedules table
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can insert own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can delete own schedules" ON schedules;

-- Create proper RLS policies
CREATE POLICY "Users can view own schedules" 
    ON schedules FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedules" 
    ON schedules FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedules" 
    ON schedules FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedules" 
    ON schedules FOR DELETE 
    USING (auth.uid() = user_id);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'schedules';
```

##### Task 2.2: Ensure User ID Association in All Operations

```javascript
// In all database operations (script.js, editor.js, search.js)

// BEFORE (Potentially problematic - no user context):
async function loadScheduleData() {
    const { data, error } = await supabase
        .from('schedules')
        .select('*');
    
    return data;
}

// AFTER (Correct - with user context):
async function loadScheduleData() {
    try {
        // Always get current user first
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            console.error('User not authenticated:', userError);
            throw new Error('Authentication required');
        }
        
        // Query with user_id filter
        const { data, error } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Load data error:', error);
            throw new Error(`Failed to load data: ${error.message}`);
        }
        
        console.log('Loaded schedule data for user:', user.id, data);
        
        return data || [];
        
    } catch (error) {
        console.error('Failed to load schedule data:', error);
        return [];
    }
}

// Apply same pattern to all CRUD operations
async function saveScheduleData(scheduleData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
        .from('schedules')
        .upsert({
            user_id: user.id,
            schedule_data: scheduleData,
            updated_at: new Date().toISOString()
        });
    
    if (error) throw new Error(`Save failed: ${error.message}`);
    return data;
}

async function deleteScheduleEntry(entryId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id); // Critical: user_id check
    
    if (error) throw new Error(`Delete failed: ${error.message}`);
}
```

##### Task 2.3: Add Session State Management

```javascript
// In supabase-client.js or authentication handler
class AuthenticationManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.initializeAuthListener();
    }
    
    initializeAuthListener() {
        // Listen for auth state changes
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session);
            
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                this.onSignIn(session.user);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.onSignOut();
            } else if (event === 'TOKEN_REFRESHED') {
                this.currentUser = session.user;
            }
            
            // Notify listeners
            this.notifyListeners(event, session);
        });
    }
    
    async onSignIn(user) {
        console.log('User signed in:', user.id);
        
        // Load user data
        await this.loadUserData(user.id);
        
        // Show authenticated UI
        this.showAuthenticatedUI();
    }
    
    async onSignOut() {
        console.log('User signed out');
        
        // Clear local data
        this.clearLocalData();
        
        // Show unauthenticated UI
        this.showUnauthenticatedUI();
    }
    
    async loadUserData(userId) {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('user_id', userId);
            
            if (error) {
                console.error('Failed to load user data:', error);
                return;
            }
            
            // Store in memory and localStorage
            this.userScheduleData = data;
            localStorage.setItem('userScheduleData', JSON.stringify(data));
            
            // Trigger UI update
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    clearLocalData() {
        // Clear only user-specific data, not app settings
        localStorage.removeItem('userScheduleData');
        localStorage.removeItem('scheduleData');
        this.userScheduleData = null;
    }
    
    addListener(callback) {
        this.authStateListeners.push(callback);
    }
    
    notifyListeners(event, session) {
        this.authStateListeners.forEach(listener => {
            try {
                listener(event, session);
            } catch (error) {
                console.error('Auth listener error:', error);
            }
        });
    }
}

// Initialize global auth manager
const authManager = new AuthenticationManager();
```

#### Implementation Steps
1. Verify and fix RLS policies in Supabase
2. Add user_id checks to all database operations
3. Implement proper session state management
4. Add authentication state listeners
5. Test with multiple user accounts

---

### 3. Edit/Delete Operations Not Persisting

#### Symptoms
- Edits appear in UI but revert after refresh
- Deleted entries reappear after refresh
- "Edit/Delete test failed" error
- Entry count doesn't change after deletion

#### Root Causes
1. **Save not being called after edit/delete**
2. **Optimistic UI updates without database confirmation**
3. **Database update queries not executing**
4. **Cache invalidation issues**

#### Refactoring Tasks

##### Task 3.1: Add Proper Edit/Delete Handlers

```javascript
// In editor.js
async function updateWeekdayEntry(entryId, entryData) {
    try {
        console.log('Updating entry:', entryId, entryData);
        
        // Show loading
        showLoadingIndicator('Updating entry...');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Update in database
        const { data, error } = await supabase
            .from('schedule_entries')
            .update({
                grade: entryData.grade,
                start_time: entryData.startTime,
                end_time: entryData.endTime,
                subject: entryData.subject,
                updated_at: new Date().toISOString()
            })
            .eq('id', entryId)
            .eq('user_id', user.id)
            .select();
        
        if (error) {
            throw new Error(`Update failed: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
            throw new Error('Entry not found or unauthorized');
        }
        
        console.log('Entry updated successfully:', data);
        
        // Update UI
        updateEntryInUI(entryId, data[0]);
        
        // Update localStorage cache
        updateLocalStorageCache();
        
        // Show success
        showSuccessMessage('Entry updated successfully');
        
        return { success: true, data: data[0] };
        
    } catch (error) {
        console.error('Update failed:', error);
        showErrorMessage('Failed to update entry: ' + error.message);
        
        // Revert UI changes
        revertUIChanges();
        
        return { success: false, error: error.message };
    } finally {
        hideLoadingIndicator();
    }
}

async function deleteWeekdayEntry(entryId) {
    try {
        console.log('Deleting entry:', entryId);
        
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this entry?')) {
            return { success: false, cancelled: true };
        }
        
        // Show loading
        showLoadingIndicator('Deleting entry...');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Store entry data for potential rollback
        const entryBackup = await getEntryById(entryId);
        
        // Delete from database
        const { error } = await supabase
            .from('schedule_entries')
            .delete()
            .eq('id', entryId)
            .eq('user_id', user.id);
        
        if (error) {
            throw new Error(`Delete failed: ${error.message}`);
        }
        
        console.log('Entry deleted successfully');
        
        // Remove from UI
        removeEntryFromUI(entryId);
        
        // Update localStorage cache
        updateLocalStorageCache();
        
        // Show success with undo option
        showSuccessMessageWithUndo('Entry deleted', () => {
            restoreEntry(entryBackup);
        });
        
        return { success: true };
        
    } catch (error) {
        console.error('Delete failed:', error);
        showErrorMessage('Failed to delete entry: ' + error.message);
        return { success: false, error: error.message };
    } finally {
        hideLoadingIndicator();
    }
}

// Helper function to update localStorage cache
async function updateLocalStorageCache() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
            .from('schedule_entries')
            .select('*')
            .eq('user_id', user.id);
        
        if (!error && data) {
            localStorage.setItem('scheduleData', JSON.stringify(data));
            console.log('localStorage cache updated');
        }
    } catch (error) {
        console.error('Failed to update cache:', error);
    }
}
```

##### Task 3.2: Add Database Transaction Support for Complex Operations

```javascript
// For operations that involve multiple database changes
async function performComplexScheduleUpdate(updates) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    try {
        // Start transaction (Supabase doesn't support explicit transactions,
        // but we can use batch operations and rollback on failure)
        
        const operations = [];
        const rollbackOperations = [];
        
        // Perform all updates
        for (const update of updates) {
            const { data, error } = await supabase
                .from('schedule_entries')
                .update(update.data)
                .eq('id', update.id)
                .select();
            
            if (error) {
                // Rollback all previous operations
                await rollbackAllOperations(rollbackOperations);
                throw new Error(`Update failed: ${error.message}`);
            }
            
            operations.push({ type: 'update', id: update.id, data });
            rollbackOperations.push({
                type: 'revert',
                id: update.id,
                originalData: update.originalData
            });
        }
        
        return { success: true, operations };
        
    } catch (error) {
        console.error('Complex update failed:', error);
        return { success: false, error: error.message };
    }
}

async function rollbackAllOperations(rollbackOperations) {
    for (const operation of rollbackOperations) {
        try {
            await supabase
                .from('schedule_entries')
                .update(operation.originalData)
                .eq('id', operation.id);
        } catch (error) {
            console.error('Rollback failed:', error);
        }
    }
}
```

#### Implementation Steps
1. Add proper async/await handling to edit/delete operations
2. Implement database confirmation before UI updates
3. Add rollback capability for failed operations
4. Update localStorage cache after database operations
5. Add user feedback and error handling

---

### 4. Database Schema Issues

#### Symptoms
- Database queries fail with schema errors
- Fields are missing or incorrect type
- Foreign key constraints fail
- "Database operation failed" errors

#### Refactoring Tasks

##### Task 4.1: Verify and Update Database Schema

```sql
-- In database-schema.sql
-- Ensure the schema supports all required operations

-- Main schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    schedule_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Alternative: Normalized schedule entries table (recommended for better queries)
CREATE TABLE IF NOT EXISTS schedule_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('weekday', 'specific_date', 'date_range')),
    
    -- For weekday entries
    weekday VARCHAR(10) CHECK (weekday IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    
    -- For specific date entries
    specific_date DATE,
    
    -- For date range entries
    start_date DATE,
    end_date DATE,
    
    -- Common fields
    grade VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_user_entries (user_id),
    INDEX idx_weekday (user_id, weekday),
    INDEX idx_specific_date (user_id, specific_date),
    INDEX idx_date_range (user_id, start_date, end_date)
);

-- Enable RLS
ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own entries" 
    ON schedule_entries 
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_schedule_entries_updated_at 
    BEFORE UPDATE ON schedule_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

##### Task 4.2: Add Database Migration Support

```javascript
// In src/database-migrations.js (new file)
class DatabaseMigrations {
    static async checkAndRunMigrations() {
        const migrations = [
            {
                version: '1.0.0',
                name: 'Initial schema',
                sql: `-- Initial schema SQL here`
            },
            {
                version: '1.1.0',
                name: 'Add schedule_entries table',
                sql: `-- Migration SQL here`
            }
        ];
        
        // Check current version
        const currentVersion = await this.getCurrentVersion();
        
        // Run pending migrations
        for (const migration of migrations) {
            if (this.versionCompare(migration.version, currentVersion) > 0) {
                await this.runMigration(migration);
            }
        }
    }
    
    static async runMigration(migration) {
        console.log(`Running migration: ${migration.name}`);
        // Execute migration SQL
        // Update version
    }
}
```

#### Implementation Steps
1. Review and update database schema
2. Verify all required fields are present
3. Add proper indexes for performance
4. Ensure RLS policies are correct
5. Test schema with all CRUD operations

---

## Implementation Priority

### Critical (Must Fix Immediately)
1. **Database Save Operations:** Ensure saves complete before UI updates
2. **User ID Association:** Add user_id to all database operations
3. **RLS Policies:** Fix Row Level Security policies
4. **Session Management:** Implement proper auth state handling

### High Priority (Fix in Next Sprint)
1. **Edit/Delete Confirmation:** Add database confirmation before UI updates
2. **Error Handling:** Improve error handling and user feedback
3. **Cache Invalidation:** Update localStorage after database operations
4. **Loading Indicators:** Add visual feedback for async operations

### Medium Priority (Address Soon)
1. **Transaction Support:** Add rollback capability
2. **Database Schema:** Normalize schema if using JSONB
3. **Performance Optimization:** Add indexes and optimize queries
4. **Undo Functionality:** Add undo capability for deletions

### Low Priority (Future Enhancements)
1. **Offline Support:** Add offline-first functionality
2. **Conflict Resolution:** Handle concurrent edits
3. **Data Validation:** Add comprehensive validation
4. **Audit Logging:** Track all data changes

---

## Testing After Refactoring

After implementing the refactoring changes, re-run Test 5.1:

```bash
cd tests/group_5
node test_5_1_schedule_data_persistence.js
```

### Verification Checklist

- [ ] All 8 test steps pass
- [ ] No errors in test output
- [ ] All screenshots show expected state
- [ ] Data snapshots match before/after operations
- [ ] Page refresh preserves all data
- [ ] Logout/login preserves all data
- [ ] Edit operations persist correctly
- [ ] Delete operations persist correctly
- [ ] No console errors during test
- [ ] Database contains expected data

---

## Success Criteria

### Functional Requirements
- ✅ Data persists after page refresh
- ✅ Data persists across user sessions
- ✅ Edit operations save permanently
- ✅ Delete operations remove permanently
- ✅ No data corruption occurs
- ✅ User data is properly isolated

### Non-Functional Requirements
- ✅ Save operations complete within 2 seconds
- ✅ No race conditions in async operations
- ✅ Proper error handling with user feedback
- ✅ Graceful degradation on failures

### Security Requirements
- ✅ RLS policies enforce user data isolation
- ✅ All operations verify user authentication
- ✅ No cross-user data leakage
- ✅ Secure session management

---

## Files to Modify

### High Priority
1. `public/js/editor.js` - Add proper save/edit/delete handlers
2. `public/js/script.js` - Add session management and data loading
3. `public/js/supabase-client.js` - Add authentication state management
4. `database-schema.sql` - Fix RLS policies and schema

### Medium Priority
1. `src/server.js` - Add API endpoint validation
2. `public/css/styles.css` - Add loading indicators
3. `tests/group_5/test_5_1_schedule_data_persistence.js` - Update test assertions

---

## Estimated Effort

- **Database Schema & RLS:** 3-4 hours
- **Save Operation Fixes:** 4-6 hours
- **Session Management:** 4-6 hours
- **Edit/Delete Operations:** 3-4 hours
- **Error Handling & UI Feedback:** 2-3 hours
- **Testing & Verification:** 2-3 hours
- **Total:** 18-26 hours

---

## Additional Resources

- [Supabase Row Level Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/)
- [Playwright Testing Best Practices](https://playwright.dev/docs/best-practices)
- Database Schema: `database-schema.sql`
- Test Proposal: `tests/TEST_PROPOSAL.md`

---

## Conclusion

Data persistence is critical for user trust and application reliability. The issues identified in Test 5.1 primarily relate to async operation handling, user authentication association, and database transaction management. Implementing the refactoring tasks in this document will ensure robust data persistence across all application states.

Focus first on the critical items (database saves and user association) before addressing the medium and low priority items. After each major change, re-run the test to verify the fix worked and didn't introduce new issues.

---

**Last Updated:** October 1, 2025  
**Document Version:** 1.0  
**Test Version:** 1.0

