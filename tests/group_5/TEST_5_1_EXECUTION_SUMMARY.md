# Test 5.1: Schedule Data Persistence - Execution Summary

## Test Information
**Test Name:** Test 5.1: Schedule Data Persistence  
**Test Date:** October 1, 2025  
**Test Category:** Data Persistence Tests  
**Test Script:** `test_5_1_schedule_data_persistence.js`  

## Test Objective
Verify that schedule data persists correctly across:
- Page refreshes
- User sessions (logout/login cycles)
- Data editing operations
- Data deletion operations
- Database transactions

## Test Prerequisites

### Environment Requirements
1. **Node.js:** Version 14 or higher
2. **Dependencies:** Playwright installed (`npm install playwright`)
3. **Server:** Application running on `http://localhost:3000`
4. **Database:** Supabase connection configured and accessible
5. **Authentication:** User registration and login functional

### Pre-Test Setup
1. Ensure the server is running:
   ```bash
   npm start
   ```

2. Verify Supabase connection is active

3. Clear any existing test data for user `testpersistence@example.com`

4. Ensure port 3000 is accessible

## Test Execution Instructions

### Running the Test

#### Option 1: Direct Execution
```bash
cd tests/group_5
node test_5_1_schedule_data_persistence.js
```

#### Option 2: From Project Root
```bash
node tests/group_5/test_5_1_schedule_data_persistence.js
```

### Expected Test Duration
**Estimated Time:** 3-5 minutes

### Test Execution Flow

The test will execute the following steps automatically:

#### Step 1: Setup and Authentication (30-45 seconds)
- Launch browser
- Navigate to application
- Register/login test user (`testpersistence@example.com`)
- Verify authentication successful

#### Step 2: Create Weekday Schedule Entry (20-30 seconds)
- Navigate to schedule editor
- Select weekday tab
- Create entry for Monday
- Save schedule
- Verify entry created

#### Step 3: Create Specific Date Schedule Entry (20-30 seconds)
- Switch to specific dates tab
- Select tomorrow's date
- Create schedule entry
- Save schedule
- Verify entry created

#### Step 4: Create Date Range Schedule Entry (30-45 seconds)
- Switch to date range tab
- Select date range (5 days)
- Create schedule event
- Apply to all weekdays in range
- Verify entries created

#### Step 5: Test Page Refresh Persistence (15-20 seconds)
- Capture current schedule data
- Take screenshot before refresh
- Reload page
- Take screenshot after refresh
- Compare data snapshots
- Verify data matches

#### Step 6: Test Session Persistence (45-60 seconds)
- Capture current schedule data
- Log out user
- Take screenshot after logout
- Log back in with same credentials
- Verify data is still present
- Compare data integrity

#### Step 7: Test Editing Existing Data (20-30 seconds)
- Navigate to schedule editor
- Select weekday with existing entry
- Modify entry time
- Save changes
- Verify changes persisted

#### Step 8: Test Deleting Data (20-30 seconds)
- Navigate to schedule editor
- Select weekday with existing entry
- Delete one entry
- Save changes
- Verify entry removed

## Test Output

### Generated Files

The test will generate the following files in `tests/group_5/`:

1. **Test Results JSON:**
   - `test_5_1_results_[timestamp].json`
   - Complete test execution data

2. **Screenshots:**
   - `test_5_1_weekday_created_[timestamp].png`
   - `test_5_1_specific_date_created_[timestamp].png`
   - `test_5_1_date_range_created_[timestamp].png`
   - `test_5_1_before_refresh_[timestamp].png`
   - `test_5_1_after_refresh_[timestamp].png`
   - `test_5_1_after_logout_[timestamp].png`
   - `test_5_1_after_relogin_[timestamp].png`
   - `test_5_1_after_edit_[timestamp].png`
   - `test_5_1_after_delete_[timestamp].png`

3. **Console Output:**
   - Real-time test progress
   - Step-by-step results
   - Error messages (if any)
   - Final summary statistics

### Console Output Format

```
🚀 Starting Test 5.1: Schedule Data Persistence
📋 Setting up test environment...
✅ Test environment setup complete
🔐 Authenticating test user...
✅ Successfully authenticated
📅 Creating weekday schedule entry...
✅ Weekday schedule entry created
📆 Creating specific date schedule entry...
✅ Specific date schedule entry created
📅 Creating date range schedule entry...
✅ Date range schedule entry created
🔄 Testing data persistence after page refresh...
✅ Data persisted correctly after page refresh
🔐 Testing data persistence across sessions...
✅ Logged out successfully
✅ Successfully logged back in
✏️  Testing editing existing data...
✅ Successfully edited schedule entry
🗑️  Testing deleting data...
✅ Successfully deleted entry (3 -> 2)
✅ Test 5.1 completed

📋 TEST 5.1 SUMMARY
===================
Total Steps: 8
Passed: 8
Failed: 0
Skipped: 0
Success Rate: 100.0%

📸 Screenshots: 9
📊 Data Snapshots: 4

🎯 Overall Status: PASS

📊 Test results saved to: test_5_1_results_[timestamp].json
```

## Expected Results

### Success Criteria

All of the following must be true for the test to pass:

1. ✅ **Weekday schedule entry created successfully**
   - Entry appears in schedule list
   - Data saved to database

2. ✅ **Specific date entry created successfully**
   - Entry created for specified date
   - Data saved to database

3. ✅ **Date range entries created successfully**
   - Multiple entries created for weekdays in range
   - All entries saved to database

4. ✅ **Data persists after page refresh**
   - All schedule data remains after page reload
   - No data corruption or loss

5. ✅ **Data persists across user sessions**
   - Data remains after logout/login cycle
   - User can access same schedule data

6. ✅ **Editing existing data works correctly**
   - Modified entries save properly
   - Changes persist across operations

7. ✅ **Deleting data removes it permanently**
   - Deleted entries no longer appear
   - Database reflects deletion

### Failure Scenarios

The test may fail if:

1. ❌ **Authentication fails**
   - User registration/login issues
   - Supabase authentication errors

2. ❌ **Database connection issues**
   - Cannot connect to Supabase
   - Database query failures

3. ❌ **Data not persisting**
   - Page refresh loses data
   - Session changes lose data

4. ❌ **Edit/Delete operations fail**
   - Changes don't save
   - Deletions don't persist

5. ❌ **UI elements not found**
   - Selectors changed
   - Page structure modified

## Troubleshooting

### Common Issues

#### Issue 1: Server Not Running
**Error:** `Navigation failed` or `Connection refused`  
**Solution:**
```bash
# Start the server
npm start
```

#### Issue 2: Authentication Fails
**Error:** `Authentication failed` or `Login timeout`  
**Solutions:**
- Verify Supabase configuration in `.env`
- Check Supabase project status
- Clear browser data and retry
- Manually create test user via Supabase dashboard

#### Issue 3: Playwright Not Installed
**Error:** `Cannot find module 'playwright'`  
**Solution:**
```bash
npm install playwright
# Or install browsers specifically
npx playwright install
```

#### Issue 4: Selectors Not Found
**Error:** `Element not found` or `Timeout waiting for selector`  
**Solutions:**
- Verify application UI hasn't changed
- Check if elements have different IDs/classes
- Update selectors in test script
- Increase timeout values

#### Issue 5: Port Already in Use
**Error:** `Port 3000 already in use`  
**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Kill the process or use different port
```

### Debug Mode

To run the test with additional debugging:

1. **Keep browser open:**
   - The test already runs with `headless: false`
   - Browser will stay open during execution

2. **Add console logging:**
   - Check browser console during test
   - Monitor network tab for API calls

3. **Increase timeouts:**
   - Edit timeout values in test script if needed
   - Default: 15000ms for navigation, 2000ms for waits

## Post-Test Actions

### After Successful Test
1. Review generated screenshots
2. Examine JSON results file
3. Verify test summary statistics
4. Document any observations

### After Failed Test
1. Review error messages in console
2. Check generated screenshots for UI state
3. Examine JSON results for specific failures
4. Follow refactoring prompt if provided
5. Fix identified issues
6. Re-run test

## Test Data Cleanup

The test uses a dedicated test user: `testpersistence@example.com`

**To clean up test data:**

1. Via Supabase Dashboard:
   - Delete schedule entries for test user
   - Optionally delete test user account

2. Via Database Query:
   ```sql
   -- Delete schedule data for test user
   DELETE FROM schedules 
   WHERE user_id IN (
     SELECT id FROM auth.users 
     WHERE email = 'testpersistence@example.com'
   );
   
   -- Optional: Delete test user
   DELETE FROM auth.users 
   WHERE email = 'testpersistence@example.com';
   ```

## Related Documentation
- Test Proposal: `tests/TEST_PROPOSAL.md`
- Test Results: `tests/group_5/TEST_5_1_RESULTS.md`
- Refactoring Prompt: `tests/group_5/TEST_5_1_REFACTORING_PROMPT.md` (if test fails)

## Notes
- This test creates real data in the database
- Test user credentials are hardcoded for consistency
- Screenshots help visualize each test step
- Data snapshots verify persistence integrity
- Test is idempotent (can be run multiple times)

---

**Last Updated:** October 1, 2025  
**Test Version:** 1.0  
**Test Framework:** Playwright

