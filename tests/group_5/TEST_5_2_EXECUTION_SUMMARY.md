# Test 5.2: User Data Isolation - Execution Summary

## Overview

**Test Name:** Test 5.2: User Data Isolation  
**Test Category:** Data Persistence Tests (Group 5)  
**Test Framework:** Playwright  
**Purpose:** Verify that user data is properly isolated between different users

## Test Objective

This test validates that:
- Each user can only see their own schedule data
- No cross-user data contamination occurs
- User authentication properly isolates data
- Database queries respect user permissions
- Row Level Security (RLS) policies work correctly
- Editing/deleting operations only affect the current user's data

## Prerequisites

### Environment Requirements

1. **Node.js 14+** installed
2. **Playwright** installed:
   ```bash
   npm install playwright
   ```
3. **Server running** on `http://localhost:3000`:
   ```bash
   npm start
   ```
4. **Supabase configured** and accessible
5. **Database schema applied** with proper RLS policies

### Configuration Checks

Before running the test, verify:

```bash
# Check if server is running
curl http://localhost:3000

# Check Node.js version
node --version

# Check if Playwright is installed
npm list playwright
```

### Database Requirements

Ensure your Supabase database has:
- **Row Level Security (RLS)** enabled on the `schedules` table
- **Proper RLS policies** that filter by `user_id`
- **Auth service** properly configured

Example RLS policy:
```sql
-- Policy for SELECT
CREATE POLICY "Users can view own schedules"
ON schedules FOR SELECT
USING (auth.uid() = user_id);

-- Policy for INSERT
CREATE POLICY "Users can insert own schedules"
ON schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE
CREATE POLICY "Users can update own schedules"
ON schedules FOR UPDATE
USING (auth.uid() = user_id);

-- Policy for DELETE
CREATE POLICY "Users can delete own schedules"
ON schedules FOR DELETE
USING (auth.uid() = user_id);
```

## Test Execution

### Run the Test

```bash
# Navigate to test directory
cd tests/group_5

# Execute the test
node test_5_2_user_data_isolation.js
```

### Test Flow

The test executes the following steps:

```
1. Setup Environment (5-10s)
   ├─ Launch browser
   ├─ Create Context A (simulating Browser 1)
   ├─ Create Context B (simulating Browser 2/Incognito)
   └─ Initialize both pages

2. Authenticate User A (10-15s)
   ├─ Navigate to application
   ├─ Register/Login as testisolation_a@example.com
   ├─ Verify authentication successful
   └─ Capture screenshot

3. Authenticate User B (10-15s)
   ├─ Navigate to application (in separate context)
   ├─ Register/Login as testisolation_b@example.com
   ├─ Verify authentication successful
   └─ Capture screenshot

4. Create Schedule Data - User A (15-20s)
   ├─ Navigate to schedule editor
   ├─ Create weekday schedule entry:
   │  - Day: Monday
   │  - Grade: 6A
   │  - Time: 08:00-08:45
   │  - Subject: Math - User A
   ├─ Save schedule
   └─ Capture screenshot

5. Verify User B Isolation (10-15s)
   ├─ Switch to User B context
   ├─ Navigate to calendar
   ├─ Verify User A's data is NOT visible
   ├─ Count visible schedule items
   └─ Capture screenshot

6. Create Schedule Data - User B (15-20s)
   ├─ Navigate to schedule editor
   ├─ Create weekday schedule entry:
   │  - Day: Monday
   │  - Grade: 11A
   │  - Time: 10:00-10:45
   │  - Subject: Science - User B
   ├─ Save schedule
   └─ Capture screenshot

7. Verify User A Isolation (10-15s)
   ├─ Switch back to User A context
   ├─ Navigate to calendar
   ├─ Verify User B's data is NOT visible
   ├─ Count visible schedule items
   └─ Capture screenshot

8. Verify User A Own Data (10-15s)
   ├─ Navigate to schedule editor
   ├─ Verify User A can see their own data
   ├─ Check data matches what was created
   └─ Capture screenshot

9. Verify User B Own Data (10-15s)
   ├─ Navigate to schedule editor
   ├─ Verify User B can see their own data
   ├─ Check data matches what was created
   └─ Capture screenshot

10. Test Edit/Delete Isolation (20-30s)
    ├─ User A: Test delete operation on own data
    ├─ Verify deletion only affects User A's data
    ├─ User B: Test delete operation on own data
    ├─ Verify deletion only affects User B's data
    └─ Capture screenshots

11. Cleanup & Report (5-10s)
    ├─ Close both browser contexts
    ├─ Generate results JSON file
    └─ Display test summary
```

**Total Expected Duration:** 2-3 minutes

## Test Users

### User A
- **Email:** `testisolation_a@example.com`
- **Password:** `testpassword123`
- **Name:** `Test User A`
- **Purpose:** Primary test user

### User B
- **Email:** `testisolation_b@example.com`
- **Password:** `testpassword123`
- **Name:** `Test User B`
- **Purpose:** Secondary test user for isolation verification

**Note:** These accounts are created automatically during test execution if they don't exist.

## Expected Output

### Success Output

```
🚀 Starting Test 5.2: User Data Isolation
📋 Setting up test environment...
✅ Test environment setup complete
🔐 Authenticating Test User A...
✅ Test User A authenticated successfully
✅ Step_2: Test User A Authentication: Test User A logged in successfully
🔐 Authenticating Test User B...
✅ Test User B authenticated successfully
✅ Step_3: Test User B Authentication: Test User B logged in successfully
📝 Creating schedule data for User A...
   Adding weekday entry for User A...
✅ Schedule data created for User A
✅ Step_4: Create Schedule Data for User A: Schedule entry created: 6A Monday 08:00-08:45 Math - User A
🔍 Verifying User B does not see User A's data...
✅ Verified User B does not see User A's data
   Schedule items visible: 0
✅ Step_5: Verify Data Isolation - User B View: User B sees 0 items (should not see User A's data)
📝 Creating schedule data for User B...
   Adding weekday entry for User B...
✅ Schedule data created for User B
✅ Step_6: Create Schedule Data for User B: Schedule entry created: 11A Monday 10:00-10:45 Science - User B
🔍 Verifying User A does not see User B's data...
✅ Verified User A does not see User B's data
   Schedule items visible: 1
✅ Step_7: Verify Data Isolation - User A View: User A sees 1 items (should not see User B's data)
🔍 Verifying User A can see their own data...
✅ User A can see their own data
✅ Step_8: Verify Own Data Visible - User A: User A can see their own schedule data
🔍 Verifying User B can see their own data...
✅ User B can see their own data
✅ Step_9: Verify Own Data Visible - User B: User B can see their own schedule data
🔍 Testing edit/delete isolation for User A...
✅ Edit/Delete test completed for User A: 1 -> 0 entries
✅ Step_10a: Test Edit/Delete Isolation - User A: User A can edit/delete their own data: 1 -> 0 entries
🔍 Testing edit/delete isolation for User B...
✅ Edit/Delete test completed for User B: 1 -> 0 entries
✅ Step_10b: Test Edit/Delete Isolation - User B: User B can edit/delete their own data: 1 -> 0 entries

======================================================================
📊 TEST SUMMARY
======================================================================
Test Name: Test 5.2: User Data Isolation
Status: ✅ PASS
Duration: 145.32s
Total Steps: 12
Passed Steps: 12
Failed Steps: 0
Screenshots: 10
Errors: 0
======================================================================

📸 Screenshots:
   1. test_5_2_Step_2_authenticated_1696176000000.png
   2. test_5_2_Step_3_authenticated_1696176015000.png
   3. test_5_2_Step_4_data_created_1696176030000.png
   4. test_5_2_Step_5_no_data_visible_1696176045000.png
   5. test_5_2_Step_6_data_created_1696176060000.png
   6. test_5_2_Step_7_no_data_visible_1696176075000.png
   7. test_5_2_Step_8_own_data_visible_1696176090000.png
   8. test_5_2_Step_9_own_data_visible_1696176105000.png
   9. test_5_2_Step_10a_after_delete_1696176120000.png
   10. test_5_2_Step_10b_after_delete_1696176135000.png

🎯 Overall Status: ✅ PASS
======================================================================
```

### Failure Output

```
🚀 Starting Test 5.2: User Data Isolation
📋 Setting up test environment...
✅ Test environment setup complete
🔐 Authenticating Test User A...
❌ Authentication failed for Test User A: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
❌ Step_2: Test User A Authentication: page.goto: net::ERR_CONNECTION_REFUSED

======================================================================
📊 TEST SUMMARY
======================================================================
Test Name: Test 5.2: User Data Isolation
Status: ❌ FAIL
Duration: 15.45s
Total Steps: 1
Passed Steps: 0
Failed Steps: 1
Screenshots: 0
Errors: 1
======================================================================

❌ Errors:
   1. [test_execution_error] User A authentication failed

🎯 Overall Status: ❌ FAIL
======================================================================
```

## Generated Files

After test execution, the following files are created in `tests/group_5/`:

### Results File
- **Pattern:** `test_5_2_results_[timestamp].json`
- **Content:** Complete test results in JSON format
- **Example:** `test_5_2_results_1696176000000.json`

### Screenshots
- **Pattern:** `test_5_2_[step]_[description]_[timestamp].png`
- **Count:** Up to 10 screenshots (depending on how far the test progresses)
- **Examples:**
  - `test_5_2_Step_2_authenticated_1696176000000.png`
  - `test_5_2_Step_4_data_created_1696176030000.png`
  - `test_5_2_Step_5_no_data_visible_1696176045000.png`

## Troubleshooting

### Issue: Connection Refused

**Error:**
```
❌ Authentication failed: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
```

**Solutions:**
1. Start the server:
   ```bash
   npm start
   ```
2. Verify port 3000 is not in use by another application
3. Check firewall settings
4. Ensure `.env` file has correct configuration

### Issue: Authentication Fails

**Error:**
```
❌ Authentication failed for User A: Authentication failed
```

**Solutions:**
1. Verify Supabase configuration in `.env`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   ```
2. Check Supabase project is active
3. Verify email confirmation is disabled in Supabase Auth settings
4. Manually create test users via Supabase dashboard

### Issue: Data Isolation Fails

**Error:**
```
❌ Verify Data Isolation - User B View: User B can see User A's data
```

**Solutions:**
1. **Check RLS Policies:**
   ```sql
   -- View existing policies
   SELECT * FROM pg_policies WHERE tablename = 'schedules';
   ```
2. **Enable RLS:**
   ```sql
   ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
   ```
3. **Review user_id column:**
   - Ensure `user_id` is properly set when creating schedules
   - Verify `user_id` matches `auth.uid()`
4. **Follow TEST_5_2_REFACTORING_PROMPT.md** for detailed fixes

### Issue: Playwright Not Found

**Error:**
```
Error: Cannot find module 'playwright'
```

**Solution:**
```bash
npm install playwright
```

### Issue: Test Hangs or Freezes

**Solutions:**
1. Increase timeout values in the test script
2. Check network connectivity to Supabase
3. Review browser console for JavaScript errors
4. Close other applications that might interfere

### Issue: User Already Exists

**Warning:**
```
⚠️ Registration failed (user may exist), trying login...
```

**This is normal behavior.** The test will attempt to login if registration fails.

**To start fresh:**
```sql
-- Delete test users from Supabase
DELETE FROM auth.users 
WHERE email IN ('testisolation_a@example.com', 'testisolation_b@example.com');
```

## Post-Test Actions

### Analyze Results

1. **Review JSON Results:**
   ```bash
   # Find the latest results file
   ls -lt test_5_2_results_*.json | head -1
   
   # View results (use any JSON viewer)
   cat test_5_2_results_[timestamp].json | jq
   ```

2. **Review Screenshots:**
   - Open each screenshot to verify UI state
   - Compare data visibility between users
   - Check for any unexpected UI elements

3. **Check Test Summary:**
   - All steps should show `PASS` status
   - No errors should be reported
   - Screenshot count should match expected count

### Cleanup Test Data

#### Option 1: Via Supabase SQL Editor

```sql
-- Delete schedules created by test users
DELETE FROM schedules 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('testisolation_a@example.com', 'testisolation_b@example.com')
);

-- Optional: Delete test user accounts
DELETE FROM auth.users 
WHERE email IN ('testisolation_a@example.com', 'testisolation_b@example.com');
```

#### Option 2: Keep for Manual Verification

You may want to keep the test data to manually verify:
1. Login as each test user
2. Verify data isolation visually
3. Test additional scenarios manually

### Cleanup Test Files

```bash
# Remove old screenshots (keep most recent)
cd tests/group_5
rm test_5_2_Step_*_old.png

# Remove old result files (keep most recent)
rm test_5_2_results_old.json
```

## Success Criteria

The test is considered **successful** if:

✅ Both users can authenticate successfully  
✅ User A can create schedule data  
✅ User B cannot see User A's data  
✅ User B can create schedule data  
✅ User A cannot see User B's data  
✅ Each user can see their own data  
✅ Edit/delete operations only affect the current user's data  
✅ No JavaScript errors in console  
✅ All 12 steps report PASS status  
✅ No errors in the errors array  

The test is considered **failed** if:

❌ Any user can see another user's data  
❌ Authentication fails for either user  
❌ Data creation fails  
❌ RLS policies are not enforced  
❌ Edit/delete operations affect other users' data  
❌ JavaScript errors occur  

## Next Steps

### If Test Passes

1. ✅ Data isolation is working correctly
2. ✅ RLS policies are properly configured
3. ✅ No refactoring needed
4. 📝 Document test success in `TEST_5_2_RESULTS.md`
5. 🎯 Proceed to next test in the suite

### If Test Fails

1. 📖 Review `TEST_5_2_REFACTORING_PROMPT.md`
2. 🔍 Analyze the specific failure points
3. 🛠️ Implement the recommended fixes
4. 🔄 Re-run the test to verify fixes
5. 📝 Document results in `TEST_5_2_RESULTS.md`

## Integration with CI/CD

This test can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Data Isolation Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright
        run: npm install playwright
      
      - name: Start server
        run: |
          npm start &
          sleep 10
      
      - name: Run User Data Isolation Test
        run: |
          cd tests/group_5
          node test_5_2_user_data_isolation.js
      
      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-screenshots
          path: tests/group_5/test_5_2_*.png
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: tests/group_5/test_5_2_results_*.json
```

## Related Documentation

- **Test Proposal:** `tests/TEST_PROPOSAL.md` - Test 5.2 specification
- **Test Script:** `test_5_2_user_data_isolation.js` - Automated test code
- **Results:** `TEST_5_2_RESULTS.md` - Test results documentation
- **Refactoring Prompt:** `TEST_5_2_REFACTORING_PROMPT.md` - Fix recommendations
- **Database Schema:** `database-schema.sql` - Database structure
- **Supabase Setup:** `README-SUPABASE.md` - Supabase configuration

---

**Last Updated:** October 1, 2025  
**Test Version:** 1.0  
**Test Group:** 5 (Data Persistence)  
**Test Framework:** Playwright  
**Status:** Active

