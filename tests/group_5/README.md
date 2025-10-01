# Test Group 5: Data Persistence Tests

## Overview
This test group contains tests related to data persistence functionality in the Schedule Editor application. These tests verify that schedule data is properly stored, retrieved, and maintained across various application states.

## Test 5.1: Schedule Data Persistence

### Purpose
Validate that schedule data persists correctly across:
- Page refreshes
- User sessions (logout/login cycles)
- Data editing operations
- Data deletion operations
- Database transactions

### Files in This Test Group

#### 1. `test_5_1_schedule_data_persistence.js`
**Type:** Automated test script (Playwright)  
**Purpose:** Execute the data persistence test  
**Usage:**
```bash
node test_5_1_schedule_data_persistence.js
```

**What it does:**
- Launches browser and authenticates test user
- Creates various types of schedule entries (weekday, specific date, date range)
- Tests data persistence after page refresh
- Tests data persistence after logout/login
- Tests editing existing data
- Tests deleting data
- Captures screenshots at each step
- Generates JSON results file

**Output:**
- Screenshots (9 files): `test_5_1_*_[timestamp].png`
- Results file: `test_5_1_results_[timestamp].json`
- Console output with test summary

---

#### 2. `TEST_5_1_EXECUTION_SUMMARY.md`
**Type:** Documentation  
**Purpose:** Comprehensive guide for running the test  

**Contents:**
- Test prerequisites and environment setup
- Step-by-step execution instructions
- Expected test duration and flow
- Troubleshooting guide for common issues
- Post-test actions and cleanup procedures

**When to use:**
- Before running the test for the first time
- When encountering test execution issues
- To understand test flow and requirements
- For setting up test environment

---

#### 3. `TEST_5_1_RESULTS.md`
**Type:** Documentation / Results Template  
**Purpose:** Document test results and findings  

**Contents:**
- Test configuration and scope
- Expected test results for each step
- Potential failure scenarios and impacts
- Post-execution analysis guidelines
- Success criteria and verification checklist

**When to use:**
- After running the test to document results
- To understand what results to expect
- To analyze test failures
- To verify test success criteria

**Note:** This file is a template/placeholder until the test is actually executed. After execution, update it with actual results.

---

#### 4. `TEST_5_1_REFACTORING_PROMPT.md`
**Type:** Refactoring Guide  
**Purpose:** Provide solutions for identified issues  

**Contents:**
- Common failure scenarios and root causes
- Detailed refactoring tasks with code examples
- Implementation priorities
- Success criteria and verification steps
- Estimated effort for fixes

**When to use:**
- When Test 5.1 identifies failures
- To understand how to fix data persistence issues
- As a guide for code improvements
- To estimate effort for fixes

**Key sections:**
1. Data not persisting after page refresh
2. Session persistence failure (logout/login)
3. Edit/Delete operations not persisting
4. Database schema issues

---

#### 5. `README.md` (This file)
**Type:** Documentation  
**Purpose:** Overview and navigation for Test Group 5  

---

## Quick Start

### Prerequisites
1. Node.js 14+ installed
2. Playwright installed: `npm install playwright`
3. Server running on `http://localhost:3000`
4. Supabase configured and accessible
5. Database schema applied

### Run the Test
```bash
# Navigate to test directory
cd tests/group_5

# Run the test
node test_5_1_schedule_data_persistence.js
```

### Expected Duration
3-5 minutes

### Expected Output
```
🚀 Starting Test 5.1: Schedule Data Persistence
📋 Setting up test environment...
✅ Test environment setup complete
...
🎯 Overall Status: PASS
```

---

## Test Flow

```
1. Setup & Authentication (30-45s)
   ├─ Launch browser
   ├─ Navigate to application
   ├─ Register/login test user
   └─ Verify authentication

2. Create Test Data (1-2 min)
   ├─ Create weekday schedule entry
   ├─ Create specific date entry
   └─ Create date range entries

3. Test Persistence (1-2 min)
   ├─ Test page refresh persistence
   ├─ Test session persistence (logout/login)
   ├─ Test editing data
   └─ Test deleting data

4. Cleanup & Report (10-20s)
   ├─ Close browser
   ├─ Generate results JSON
   └─ Display summary
```

---

## Understanding Test Results

### Success Indicators
- ✅ All 8 steps show PASS status
- 📸 9 screenshots generated
- 📊 JSON results file created
- 🎯 Overall Status: PASS
- No errors in error array

### Failure Indicators
- ❌ One or more steps show FAIL status
- 🎯 Overall Status: FAIL
- Errors listed in summary
- Screenshots may show unexpected UI state

### Next Steps After Failure
1. Review console output for specific errors
2. Examine generated screenshots
3. Check JSON results file for detailed error information
4. Follow `TEST_5_1_REFACTORING_PROMPT.md` for solutions
5. Fix identified issues
6. Re-run test

---

## Test Data

### Test User Credentials
- **Email:** `testpersistence@example.com`
- **Password:** `testpassword123`
- **Purpose:** Dedicated test account

**Note:** This account is created automatically during test execution if it doesn't exist.

### Test Schedule Data

#### Weekday Entry
- Day: Monday
- Grade: 6A
- Time: 08:00 - 08:45
- Subject: Class

#### Specific Date Entry
- Date: Tomorrow
- Grade: 11A
- Time: 10:00 - 10:45
- Subject: Assembly

#### Date Range Entry
- Range: Next 5 weekdays
- Grade: 9A
- Time: 14:00 - 14:45
- Subject: Prep

---

## Troubleshooting

### Test Fails to Start
**Problem:** Browser doesn't launch or connection fails  
**Solutions:**
- Verify server is running: `npm start`
- Check port 3000 is available
- Ensure Playwright is installed: `npm install playwright`

### Authentication Fails
**Problem:** Cannot login test user  
**Solutions:**
- Verify Supabase configuration in `.env`
- Check Supabase project is active
- Manually create test user via Supabase dashboard
- Clear browser cache and retry

### Data Not Persisting
**Problem:** Test reports data mismatch  
**Solutions:**
- Verify database connection
- Check RLS policies in Supabase
- Review `TEST_5_1_REFACTORING_PROMPT.md`
- Verify user_id is being saved with data

### Selectors Not Found
**Problem:** "Element not found" errors  
**Solutions:**
- Verify UI hasn't changed
- Update selectors in test script
- Increase timeout values
- Check if elements are hidden/disabled

---

## File Naming Convention

All files generated by tests follow this pattern:
```
test_5_1_[description]_[timestamp].[extension]
```

Examples:
- `test_5_1_weekday_created_1696176000000.png`
- `test_5_1_results_1696176000000.json`

---

## Cleanup

### Remove Test Data
```sql
-- Via Supabase SQL Editor
DELETE FROM schedules 
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email = 'testpersistence@example.com'
);
```

### Remove Test User (Optional)
```sql
DELETE FROM auth.users 
WHERE email = 'testpersistence@example.com';
```

### Remove Test Files
```bash
# Remove screenshots (keep most recent)
# Remove old JSON results files
```

---

## Integration with CI/CD

This test can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Data Persistence Tests
  run: |
    npm start &
    sleep 10
    cd tests/group_5
    node test_5_1_schedule_data_persistence.js
```

---

## Related Documentation

- **Test Proposal:** `tests/TEST_PROPOSAL.md` - Original test specification
- **Database Schema:** `database-schema.sql` - Database structure
- **Supabase Setup:** `README-SUPABASE.md` - Supabase configuration
- **Main README:** `README.md` - Project overview

---

## Test History

### Version 1.0 (October 1, 2025)
- Initial test creation
- Based on TEST_PROPOSAL.md Test 5.1 specification
- Covers 8 test steps
- Generates comprehensive artifacts

---

## Future Tests in Group 5

### Test 5.2: User Data Isolation (Planned)
- Verify user data isolation between different users
- Test RLS policies
- Ensure no cross-user data contamination

---

## Contributing

When adding new tests to this group:
1. Follow the naming convention: `test_5_X_description.js`
2. Create corresponding documentation files:
   - `TEST_5_X_EXECUTION_SUMMARY.md`
   - `TEST_5_X_RESULTS.md`
   - `TEST_5_X_REFACTORING_PROMPT.md`
3. Update this README with new test information
4. Follow the established test structure and patterns

---

## Support

For issues or questions:
1. Review execution summary for troubleshooting
2. Check refactoring prompt for known issues
3. Review test results for specific errors
4. Examine generated screenshots
5. Check server logs and browser console

---

**Last Updated:** October 1, 2025  
**Test Group:** 5 (Data Persistence)  
**Test Framework:** Playwright  
**Status:** Active

