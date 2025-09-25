# Schedule Editor - Automated Test Proposal

## Common Context for AI Agent

Before executing any test, the AI Agent should be provided with the following context:

### Project Overview
This is a Schedule Editor web application built with Node.js/Express backend and vanilla JavaScript frontend. The application allows users to create, manage, and search class schedules with authentication via Supabase.

### Technical Stack
- **Backend**: Node.js, Express.js, Supabase (PostgreSQL)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: Supabase Auth
- **AI Integration**: OpenAI GPT-4o-mini for image-to-schedule extraction
- **File Upload**: Multer for image processing

### Key Files Structure
```
Schedule/
├── src/
│   ├── server.js          # Main Express server
│   └── supabase.js        # Supabase configuration
├── public/
│   ├── index.html         # Main calendar view
│   ├── schedule-editor.html # Schedule editing interface
│   ├── search.html        # Search interface
│   ├── css/styles.css     # Main stylesheet
│   └── js/
│       ├── script.js      # Main calendar functionality
│       ├── editor.js      # Schedule editor functionality
│       ├── search.js      # Search functionality
│       └── supabase-client.js # Authentication client
├── database-schema.sql    # Database schema
└── package.json          # Dependencies and scripts
```

### Environment Setup Requirements
- Node.js 14+ installed
- Supabase project with database schema applied
- Environment variables configured (see env.example)
- OpenAI API key for image extraction features

### Test Execution Prerequisites
1. Start the server: `npm start` (runs on port 3000)
2. Ensure Supabase project is accessible
3. Have test user credentials ready
4. For image extraction tests, ensure OpenAI API key is configured

---

## Test Categories and Prompts

### 1. Authentication Tests

#### Test 1.1: User Registration
**Prompt:**
```
Test the user registration functionality of the Schedule Editor application.

SETUP:
1. Start the server on port 3000
2. Navigate to http://localhost:3000
3. Ensure the authentication section is visible

TEST STEPS:
1. Click on "Sign Up" link to show the registration form
2. Fill in the registration form with:
   - Full Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "testpassword123"
   - Confirm Password: "testpassword123"
   - Check the "I agree to the Terms of Service" checkbox
3. Click "Sign Up" button
4. Verify that a success message appears indicating account creation
5. Verify that the form switches back to login view
6. Check browser console for any JavaScript errors

EXPECTED RESULTS:
- Registration form displays correctly
- Form validation works (try with mismatched passwords, empty fields)
- Success message appears after successful registration
- User is redirected to login form
- No JavaScript errors in console

VALIDATION:
- Take screenshot of the registration form
- Verify all form fields are present and functional
- Confirm validation messages appear for invalid inputs
- Check that terms checkbox is required
```

#### Test 1.2: User Login
**Prompt:**
```
Test the user login functionality of the Schedule Editor application.

SETUP:
1. Ensure server is running on port 3000
2. Navigate to http://localhost:3000
3. Have valid test user credentials ready

TEST STEPS:
1. Enter valid email and password in the login form
2. Click "Sign In" button
3. Verify successful authentication and redirect to main app
4. Test with invalid credentials to ensure error handling
5. Test with empty fields to verify validation

EXPECTED RESULTS:
- Successful login redirects to main calendar view
- User email is displayed in the header
- Sign out button is visible
- Invalid credentials show appropriate error message
- Empty fields trigger validation messages

VALIDATION:
- Take screenshot of successful login state
- Verify user interface changes after authentication
- Check that authentication state persists on page refresh
```

#### Test 1.3: User Logout
**Prompt:**
```
Test the user logout functionality of the Schedule Editor application.

SETUP:
1. Ensure user is logged in to the application
2. Navigate to any page within the app

TEST STEPS:
1. Click the "Sign Out" button in the header
2. Verify logout process completes
3. Confirm redirect to authentication screen
4. Verify that protected routes are no longer accessible

EXPECTED RESULTS:
- User is logged out successfully
- Redirected to authentication screen
- User session is cleared
- Attempting to access protected routes redirects to login

VALIDATION:
- Take screenshot of logout state
- Verify authentication screen is displayed
- Check that user data is cleared from local storage
```

### 2. Calendar View Tests

#### Test 2.1: Calendar Display
**Prompt:**
```
Test the main calendar view functionality of the Schedule Editor application.

SETUP:
1. Ensure user is logged in
2. Navigate to http://localhost:3000

TEST STEPS:
1. Verify calendar grid is displayed correctly
2. Check that current month and year are shown in the header
3. Verify weekday headers (Sun, Mon, Tue, etc.) are displayed
4. Test month navigation using previous/next buttons
5. Verify today's date is highlighted
6. Test clicking on different calendar days

EXPECTED RESULTS:
- Calendar grid displays all days of the month
- Month navigation works correctly
- Today's date has visual highlighting
- Clicking on days updates the selected date
- Calendar updates correctly when navigating months

VALIDATION:
- Take screenshot of calendar view
- Verify calendar layout and styling
- Test month navigation for multiple months
- Check responsive design on different screen sizes
```

#### Test 2.2: Schedule Display
**Prompt:**
```
Test the schedule display functionality in the calendar view.

SETUP:
1. Ensure user is logged in
2. Have some test schedule data available (create via editor if needed)

TEST STEPS:
1. Click on a calendar day that has scheduled events
2. Verify that the schedule list shows the day's events
3. Check that events are displayed with correct information:
   - Grade/Class name
   - Subject
   - Start and end times
4. Verify events are sorted by start time
5. Test clicking on days with no events
6. Test the quick search functionality

EXPECTED RESULTS:
- Schedule events display correctly for selected days
- Event information is accurate and well-formatted
- Events are sorted chronologically
- Days with no events show appropriate message
- Quick search works and navigates to search page

VALIDATION:
- Take screenshot of schedule display
- Verify event formatting and layout
- Test with multiple events on the same day
- Check quick search functionality
```

### 3. Schedule Editor Tests

#### Test 3.1: Weekday Schedule Creation
**Prompt:**
```
Test the weekday schedule creation functionality in the schedule editor.

SETUP:
1. Ensure user is logged in
2. Navigate to http://localhost:3000/schedule-editor.html

TEST STEPS:
1. Verify the "Weekday Schedule" tab is active by default
2. Select a weekday from the dropdown (e.g., "Monday")
3. Click "Add Entry" button
4. Fill in the new schedule entry:
   - Grade: Select "6A"
   - Start Time: "08:00"
   - End Time: "08:45"
   - Subject: "Class"
5. Click "Save Schedule" button
6. Verify the entry appears in the schedule list
7. Test adding multiple entries for the same day
8. Test editing existing entries
9. Test deleting entries

EXPECTED RESULTS:
- New schedule entries are created successfully
- Entries display with correct formatting
- Multiple entries can be added to the same day
- Edit functionality works for existing entries
- Delete functionality removes entries correctly
- Changes are saved to the database

VALIDATION:
- Take screenshot of the editor interface
- Verify entry creation and editing workflow
- Check that data persists after page refresh
- Test with different grade levels and subjects
```

#### Test 3.2: Specific Date Schedule Creation
**Prompt:**
```
Test the specific date schedule creation functionality in the schedule editor.

SETUP:
1. Ensure user is logged in
2. Navigate to http://localhost:3000/schedule-editor.html

TEST STEPS:
1. Click on the "Specific Dates" tab
2. Select a specific date using the date picker
3. Click "Add Entry" button
4. Fill in the schedule entry with:
   - Grade: "11A"
   - Start Time: "10:00"
   - End Time: "10:45"
   - Subject: "Assembly"
5. Save the entry
6. Test adding multiple entries for the same specific date
7. Test with different dates
8. Verify entries appear in the calendar view

EXPECTED RESULTS:
- Specific date entries are created successfully
- Entries appear on the correct calendar date
- Multiple entries can be added to the same date
- Entries are properly formatted and displayed
- Data persists after page refresh

VALIDATION:
- Take screenshot of specific date editor
- Verify date picker functionality
- Check that entries appear on correct calendar dates
- Test with various date ranges
```

#### Test 3.3: Date Range Schedule Creation
**Prompt:**
```
Test the date range schedule creation functionality in the schedule editor.

SETUP:
1. Ensure user is logged in
2. Navigate to http://localhost:3000/schedule-editor.html

TEST STEPS:
1. Click on the "Date Range" tab
2. Select a start date and end date (spanning multiple weekdays)
3. Verify that the weekday preview shows the correct days
4. Click "Create New Event" button
5. Fill in the event details:
   - Grade: "9A"
   - Start Time: "14:00"
   - End Time: "14:45"
   - Subject: "Prep"
6. Click "Add Event to All Weekdays" button
7. Verify the event is added to all weekdays in the range
8. Test with different date ranges
9. Test with weekend dates (should be skipped)

EXPECTED RESULTS:
- Date range selection works correctly
- Weekday preview shows accurate days
- Events are created for all weekdays in the range
- Weekend dates are automatically skipped
- Events appear on the calendar for all specified dates
- Duplicate prevention works correctly

VALIDATION:
- Take screenshot of date range interface
- Verify weekday calculation logic
- Check that events appear on all specified dates
- Test edge cases (single day, weekend ranges)
```

#### Test 3.4: Image Upload and Schedule Extraction
**Prompt:**
```
Test the image upload and AI-powered schedule extraction functionality.

SETUP:
1. Ensure user is logged in and OpenAI API key is configured
2. Navigate to http://localhost:3000/schedule-editor.html
3. Have a sample schedule image ready (or use the provided sample_schedule.png)

TEST STEPS:
1. Click on the "Image Upload" tab
2. Click "Choose File" and select a schedule image
3. Click "Extract Schedule" button
4. Wait for the AI processing to complete
5. Review the extracted schedule data in JSON format
6. Click "Apply & Save" to apply the extracted schedule
7. Verify the schedule appears in the calendar view
8. Test with different image formats and qualities

EXPECTED RESULTS:
- Image upload works correctly
- AI extraction processes the image successfully
- Extracted data is displayed in readable JSON format
- Schedule data is accurately extracted from the image
- Applied schedule appears correctly in the calendar
- Error handling works for invalid images

VALIDATION:
- Take screenshot of image upload interface
- Verify extracted JSON data accuracy
- Check that extracted schedule matches the image content
- Test error handling with invalid images
- Verify schedule appears correctly in calendar view
```

### 4. Search Functionality Tests

#### Test 4.1: Basic Search
**Prompt:**
```
Test the basic search functionality of the Schedule Editor application.

SETUP:
1. Ensure user is logged in and has schedule data
2. Navigate to http://localhost:3000/search.html

TEST STEPS:
1. Enter a search term in the search box (e.g., "6A" or "Class")
2. Click the "Search" button
3. Verify search results are displayed
4. Test with different search terms:
   - Grade names (6A, 11A, etc.)
   - Subjects (Class, Recess, Lunch)
   - Times (8:00, 14:30)
   - Days (Monday, Tuesday)
5. Test with partial matches
6. Test with no results

EXPECTED RESULTS:
- Search results are displayed correctly
- Results match the search criteria
- Partial matches work appropriately
- No results message appears when appropriate
- Search is case-insensitive
- Results are sorted logically

VALIDATION:
- Take screenshot of search interface
- Verify search result formatting
- Test various search terms and combinations
- Check sorting and filtering logic
```

#### Test 4.2: Advanced Filtering
**Prompt:**
```
Test the advanced filtering functionality in the search interface.

SETUP:
1. Ensure user is logged in and has diverse schedule data
2. Navigate to http://localhost:3000/search.html

TEST STEPS:
1. Use the grade filter checkboxes to select specific grades
2. Use the subject filter checkboxes to select subjects
3. Use the day filter checkboxes to select specific days
4. Set time range filters (start time and end time)
5. Combine multiple filters and search
6. Test clearing all filters
7. Test saved searches functionality

EXPECTED RESULTS:
- Filter checkboxes work correctly
- Multiple filters can be combined
- Time range filtering works accurately
- Clear filters resets all selections
- Saved searches can be created and loaded
- Filter combinations produce accurate results

VALIDATION:
- Take screenshot of filter interface
- Test all filter combinations
- Verify filter state persistence
- Check saved search functionality
```

#### Test 4.3: Search Results Interaction
**Prompt:**
```
Test the interaction with search results in the search interface.

SETUP:
1. Ensure user is logged in and has schedule data
2. Navigate to http://localhost:3000/search.html
3. Perform a search to get results

TEST STEPS:
1. Click on a search result to navigate to calendar
2. Test the edit button on search results
3. Test the delete button on search results
4. Verify the edit modal functionality
5. Test exporting search results (CSV, Excel, JSON, PDF)
6. Test copying results to clipboard

EXPECTED RESULTS:
- Clicking results navigates to calendar with highlight
- Edit functionality works from search results
- Delete functionality works from search results
- Edit modal displays and functions correctly
- Export functions work for all formats
- Clipboard copy works correctly

VALIDATION:
- Take screenshot of search results
- Test all interaction buttons
- Verify export file generation
- Check calendar navigation with highlights
```

### 5. Data Persistence Tests

#### Test 5.1: Schedule Data Persistence
**Prompt:**
```
Test the data persistence functionality of the Schedule Editor application.

SETUP:
1. Ensure user is logged in
2. Create some test schedule data using the editor

TEST STEPS:
1. Create weekday schedule entries
2. Create specific date schedule entries
3. Create date range schedule entries
4. Refresh the page
5. Verify all data is still present
6. Log out and log back in
7. Verify data persists across sessions
8. Test editing existing data
9. Test deleting data

EXPECTED RESULTS:
- All schedule data persists after page refresh
- Data persists across user sessions
- Editing existing data works correctly
- Deleting data removes it permanently
- No data corruption occurs
- Database operations complete successfully

VALIDATION:
- Take screenshots before and after data operations
- Verify data integrity across sessions
- Test with large amounts of data
- Check database directly if possible
```

#### Test 5.2: User Data Isolation
**Prompt:**
```
Test that user data is properly isolated between different users.

SETUP:
1. Create two different user accounts
2. Ensure both users are logged in (use different browsers/incognito)

TEST STEPS:
1. Create schedule data with User A
2. Switch to User B and verify no data from User A is visible
3. Create different schedule data with User B
4. Switch back to User A and verify User B's data is not visible
5. Test that each user can only see their own data
6. Test that editing/deleting only affects the current user's data

EXPECTED RESULTS:
- Each user only sees their own schedule data
- No cross-user data contamination
- User authentication properly isolates data
- Database queries respect user permissions
- RLS (Row Level Security) policies work correctly

VALIDATION:
- Take screenshots of both user accounts
- Verify data isolation
- Test with multiple concurrent users
- Check database permissions
```

### 6. API Endpoint Tests

#### Test 6.1: Schedule API Endpoints
**Prompt:**
```
Test the schedule API endpoints using direct HTTP requests.

SETUP:
1. Ensure server is running on port 3000
2. Have valid authentication token ready

TEST STEPS:
1. Test GET /api/schedule endpoint:
   - Send request with valid auth token
   - Verify response contains schedule data
   - Test without auth token (should return 401)
2. Test POST /api/schedule endpoint:
   - Send schedule data with valid auth token
   - Verify data is saved successfully
   - Test with invalid data format
   - Test without auth token
3. Test /api/config endpoint:
   - Verify it returns public configuration
   - Check that sensitive data is not exposed

EXPECTED RESULTS:
- GET endpoint returns user's schedule data
- POST endpoint saves data successfully
- Authentication is required for protected endpoints
- Invalid requests return appropriate error codes
- Response formats are correct JSON

VALIDATION:
- Use tools like curl or Postman for testing
- Verify response status codes
- Check response data format
- Test error handling scenarios
```

#### Test 6.2: Search API Endpoints
**Prompt:**
```
Test the search API endpoints using direct HTTP requests.

SETUP:
1. Ensure server is running on port 3000
2. Have valid authentication token and schedule data ready

TEST STEPS:
1. Test POST /api/search endpoint:
   - Send search parameters with valid auth token
   - Test with different search criteria
   - Verify pagination works
   - Test without auth token
2. Test /api/search/analytics endpoint:
   - Verify it returns analytics data
   - Check data format and structure
3. Test error handling:
   - Send invalid search parameters
   - Test with malformed requests

EXPECTED RESULTS:
- Search endpoint returns filtered results
- Pagination works correctly
- Analytics endpoint returns relevant data
- Error handling works appropriately
- Response times are reasonable

VALIDATION:
- Test various search parameter combinations
- Verify result accuracy
- Check pagination functionality
- Test performance with large datasets
```

#### Test 6.3: Image Extraction API
**Prompt:**
```
Test the image extraction API endpoint using direct HTTP requests.

SETUP:
1. Ensure server is running on port 3000
2. Have valid authentication token and OpenAI API key configured
3. Have a sample schedule image ready

TEST STEPS:
1. Test POST /api/schedule/extract endpoint:
   - Send image file with valid auth token
   - Verify AI extraction works
   - Test with different image formats
   - Test without auth token
   - Test without OpenAI API key configured
2. Test error handling:
   - Send invalid file types
   - Send corrupted images
   - Test with oversized images

EXPECTED RESULTS:
- Image extraction works correctly
- Extracted data is in correct JSON format
- Error handling works for invalid inputs
- Authentication is required
- OpenAI integration works properly

VALIDATION:
- Test with various image formats
- Verify extraction accuracy
- Check error response formats
- Test file size limits
```

### 7. User Interface Tests

#### Test 7.1: Responsive Design
**Prompt:**
```
Test the responsive design of the Schedule Editor application across different screen sizes.

SETUP:
1. Ensure user is logged in
2. Open browser developer tools

TEST STEPS:
1. Test desktop view (1920x1080):
   - Verify layout is optimal
   - Check all elements are visible
   - Test functionality
2. Test tablet view (768x1024):
   - Verify responsive breakpoints work
   - Check touch interactions
   - Test navigation
3. Test mobile view (375x667):
   - Verify mobile-optimized layout
   - Test touch interactions
   - Check form usability
4. Test various orientations
5. Test with different zoom levels

EXPECTED RESULTS:
- Layout adapts correctly to different screen sizes
- All functionality remains accessible
- Touch interactions work on mobile devices
- Text remains readable at all sizes
- Navigation is intuitive on all devices

VALIDATION:
- Take screenshots at different screen sizes
- Test all major functionality on each size
- Verify touch interactions work
- Check for layout issues
```

#### Test 7.2: Accessibility
**Prompt:**
```
Test the accessibility features of the Schedule Editor application.

SETUP:
1. Ensure user is logged in
2. Have screen reader software available (if possible)

TEST STEPS:
1. Test keyboard navigation:
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test form navigation
2. Test ARIA labels and roles:
   - Check that form elements have proper labels
   - Verify button roles are correct
   - Test modal accessibility
3. Test color contrast:
   - Verify text is readable
   - Check button contrast
   - Test error message visibility
4. Test with browser accessibility tools
5. Test with high contrast mode

EXPECTED RESULTS:
- All functionality is accessible via keyboard
- Screen readers can navigate the interface
- Color contrast meets accessibility standards
- Form elements are properly labeled
- Focus management works correctly

VALIDATION:
- Test keyboard navigation thoroughly
- Use browser accessibility tools
- Check color contrast ratios
- Verify ARIA implementation
```

### 8. Performance Tests

#### Test 8.1: Load Time Performance
**Prompt:**
```
Test the load time performance of the Schedule Editor application.

SETUP:
1. Clear browser cache
2. Open browser developer tools network tab

TEST STEPS:
1. Test initial page load:
   - Measure time to first contentful paint
   - Check resource loading times
   - Verify critical resources load first
2. Test subsequent page loads:
   - Check caching effectiveness
   - Measure navigation times
   - Test with different amounts of data
3. Test with slow network conditions:
   - Simulate 3G connection
   - Test with high latency
   - Verify graceful degradation
4. Test with large datasets:
   - Create many schedule entries
   - Measure search performance
   - Check calendar rendering

EXPECTED RESULTS:
- Initial load time is under 3 seconds
- Subsequent loads are faster due to caching
- Application works on slow connections
- Performance doesn't degrade significantly with large datasets
- Critical functionality loads first

VALIDATION:
- Record performance metrics
- Test under various conditions
- Monitor resource usage
- Check for performance bottlenecks
```

#### Test 8.2: Memory Usage
**Prompt:**
```
Test the memory usage of the Schedule Editor application.

SETUP:
1. Open browser developer tools memory tab
2. Ensure user is logged in

TEST STEPS:
1. Take initial memory snapshot
2. Perform various operations:
   - Create schedule entries
   - Search through data
   - Navigate between pages
   - Upload and process images
3. Take memory snapshots after each operation
4. Test memory cleanup:
   - Navigate away and back
   - Clear search results
   - Close modals
5. Test with large datasets
6. Monitor for memory leaks

EXPECTED RESULTS:
- Memory usage remains reasonable
- No significant memory leaks detected
- Memory is cleaned up after operations
- Application remains responsive
- No browser crashes due to memory issues

VALIDATION:
- Monitor memory usage over time
- Test with extended usage
- Check for memory leaks
- Verify garbage collection works
```

### 9. Error Handling Tests

#### Test 9.1: Network Error Handling
**Prompt:**
```
Test the application's handling of network errors and connectivity issues.

SETUP:
1. Ensure user is logged in
2. Open browser developer tools network tab

TEST STEPS:
1. Test offline functionality:
   - Disconnect from network
   - Try to perform operations
   - Verify error messages appear
2. Test server unavailability:
   - Stop the server
   - Try to perform operations
   - Verify graceful error handling
3. Test slow network conditions:
   - Throttle network speed
   - Test timeout handling
   - Verify loading indicators work
4. Test partial failures:
   - Simulate partial network failures
   - Test retry mechanisms
   - Verify data consistency

EXPECTED RESULTS:
- Appropriate error messages are displayed
- Application doesn't crash on network errors
- Loading indicators work correctly
- Retry mechanisms function properly
- User can recover from errors

VALIDATION:
- Test various network conditions
- Verify error message quality
- Check retry functionality
- Test recovery procedures
```

#### Test 9.2: Input Validation and Error Handling
**Prompt:**
```
Test the application's input validation and error handling mechanisms.

SETUP:
1. Ensure user is logged in
2. Navigate to the schedule editor

TEST STEPS:
1. Test form validation:
   - Submit forms with empty required fields
   - Test invalid email formats
   - Test password requirements
   - Test date validation
2. Test data validation:
   - Enter invalid time formats
   - Test with invalid date ranges
   - Test with special characters
3. Test error recovery:
   - Fix validation errors
   - Retry failed operations
   - Verify data integrity
4. Test edge cases:
   - Very long input strings
   - Special characters in data
   - Boundary value testing

EXPECTED RESULTS:
- Validation errors are clearly displayed
- Invalid inputs are rejected appropriately
- Error messages are helpful and actionable
- Data integrity is maintained
- Edge cases are handled gracefully

VALIDATION:
- Test all form validation rules
- Verify error message quality
- Check data sanitization
- Test boundary conditions
```

### 10. Integration Tests

#### Test 10.1: End-to-End Workflow
**Prompt:**
```
Test complete end-to-end workflows of the Schedule Editor application.

SETUP:
1. Start with a fresh user account
2. Ensure all services are running

TEST STEPS:
1. Complete user registration and login
2. Create a comprehensive schedule:
   - Add weekday schedules
   - Add specific date schedules
   - Add date range schedules
   - Upload and extract from image
3. Test search functionality:
   - Search for different criteria
   - Use filters and combinations
   - Export search results
4. Test calendar navigation:
   - View different months
   - Click on different days
   - Edit and delete events
5. Test data persistence:
   - Refresh page
   - Log out and back in
   - Verify all data is preserved

EXPECTED RESULTS:
- Complete workflow functions without errors
- All features work together seamlessly
- Data persists across all operations
- User experience is smooth and intuitive
- No data loss or corruption occurs

VALIDATION:
- Execute complete user journey
- Verify data consistency throughout
- Check for any workflow breaks
- Test with realistic usage patterns
```

#### Test 10.2: Cross-Browser Compatibility
**Prompt:**
```
Test the Schedule Editor application across different browsers and platforms.

SETUP:
1. Have access to multiple browsers:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

TEST STEPS:
1. Test core functionality in each browser:
   - User authentication
   - Schedule creation and editing
   - Search functionality
   - Calendar navigation
2. Test browser-specific features:
   - File upload handling
   - Local storage usage
   - CSS rendering
   - JavaScript execution
3. Test on different operating systems:
   - Windows
   - macOS
   - Linux (if available)
4. Test mobile browsers:
   - Chrome Mobile
   - Safari Mobile
   - Firefox Mobile

EXPECTED RESULTS:
- Application works consistently across all browsers
- No browser-specific bugs or issues
- Performance is acceptable on all platforms
- Mobile experience is optimized
- No feature degradation

VALIDATION:
- Test all major functionality in each browser
- Check for visual inconsistencies
- Verify performance across platforms
- Test mobile responsiveness
```

---

## Test Execution Guidelines

### Pre-Test Setup
1. **Environment Preparation**: Ensure all dependencies are installed and configured
2. **Database Setup**: Apply the database schema and verify Supabase connection
3. **Test Data**: Prepare test user accounts and sample data
4. **Browser Setup**: Clear cache and cookies, disable extensions that might interfere

### Test Execution Process
1. **Sequential Testing**: Execute tests in the order listed to build upon previous test results
2. **Documentation**: Take screenshots and document any issues found
3. **Error Reporting**: Record any errors, unexpected behaviors, or performance issues
4. **Data Verification**: Verify that test data is properly created, modified, and cleaned up

### Post-Test Cleanup
1. **Data Cleanup**: Remove test data created during testing
2. **Environment Reset**: Reset the application to a clean state
3. **Report Generation**: Compile test results and findings into a comprehensive report

### Success Criteria
- All tests execute without critical errors
- Application functionality works as expected
- Performance meets acceptable standards
- User experience is smooth and intuitive
- Data integrity is maintained throughout all operations

---

## Notes for AI Agent

When executing these tests, the AI Agent should:

1. **Follow the prompts exactly** as written, including all setup steps and validation criteria
2. **Take screenshots** at key points to document the testing process
3. **Record any deviations** from expected behavior or results
4. **Test edge cases** and error conditions thoroughly
5. **Verify data persistence** across different operations and sessions
6. **Check performance** and responsiveness during testing
7. **Document findings** clearly for each test category

The tests are designed to be comprehensive and cover all major functionality of the Schedule Editor application. Each test can be executed independently, but some tests build upon previous ones (e.g., authentication tests should be completed before testing protected functionality).
