# Test 2.2: Schedule Display - Commit Plan

## Overview
This document outlines the planned commits for refactoring the Test 2.2 Schedule Display functionality. The refactoring is broken down into 7 logical commits to ensure easier review, safer rollback, and better testing.

## Current Status
- **Test Status**: FAILED (20% success rate)
- **Critical Issues**: 5 major areas requiring fixes
- **Priority**: HIGH - Core functionality not working

## Planned Commits

### **Commit 1: Fix Schedule Data Loading**
**Scope**: Implement basic schedule data loading functionality
**Files Modified**: `public/js/script.js`

**Changes**:
- Add `loadSchedule()` async function
- Add `loadLocalScheduleData()` fallback function
- Add basic error handling for data loading failures
- Implement schedule data processing and storage

**Expected Outcome**: Schedule data loads successfully from API or fallback

---

### **Commit 2: Add Calendar Visual Indicators**
**Scope**: Add visual indicators for calendar days with events
**Files Modified**: `public/js/script.js`, `public/css/styles.css`

**Changes**:
- Add `markDaysWithEvents()` function
- Add CSS classes: `.has-events`, `.selected`
- Add visual styling for days with scheduled events
- Add event indicator dots/colors

**Expected Outcome**: Calendar days with events are visually distinguishable

---

### **Commit 3: Fix Schedule List Population**
**Scope**: Implement proper event display when clicking calendar days
**Files Modified**: `public/js/script.js`

**Changes**:
- Add `displayDayEvents()` function
- Update `handleDayClick()` function
- Add event sorting by start time
- Add event formatting and display logic
- Add "No classes" message for empty days

**Expected Outcome**: Clicking calendar days displays appropriate schedule events

---

### **Commit 4: Add Error Handling and Validation**
**Scope**: Implement comprehensive error handling and data validation
**Files Modified**: `public/js/script.js`

**Changes**:
- Add `handleScheduleError()` utility function
- Add `validateScheduleData()` function
- Add user-friendly error messages
- Add error recovery mechanisms
- Add data format validation

**Expected Outcome**: Robust error handling with user feedback

---

### **Commit 5: Fix Quick Search Functionality**
**Scope**: Make quick search button functional
**Files Modified**: `public/js/script.js`

**Changes**:
- Fix quick search button event handlers
- Add localStorage integration for search terms
- Add proper navigation to search page
- Add input validation for search terms

**Expected Outcome**: Quick search button works and navigates correctly

---

### **Commit 6: Add Server-Side Schedule API**
**Scope**: Implement backend API endpoint for schedule data
**Files Modified**: `src/server.js`

**Changes**:
- Add `/api/schedule` GET endpoint
- Add proper error handling for API
- Add JSON response formatting
- Add file reading logic for schedule.json

**Expected Outcome**: Backend API serves schedule data correctly

---

### **Commit 7: Integration Testing and Bug Fixes**
**Scope**: Final integration testing and polish
**Files Modified**: Various (as needed)

**Changes**:
- Test complete integration between all components
- Fix any remaining issues or bugs
- Add final polish and optimizations
- Verify all test requirements are met

**Expected Outcome**: Complete functionality working as expected

## Implementation Order

1. **Start with Commit 1** - Data loading is the foundation
2. **Proceed sequentially** - Each commit builds on the previous
3. **Test after each commit** - Verify functionality incrementally
4. **Address issues immediately** - Don't accumulate problems

## Testing Strategy

### After Each Commit:
- Manual testing of the specific functionality
- Check browser console for errors
- Verify UI behavior matches expectations

### After All Commits:
- Run Test 2.2 automated test
- Verify pass rate is above 80%
- Check all critical issues are resolved

## Success Criteria

### Commit 1-7 Complete:
- ✅ Schedule data loads and displays correctly
- ✅ Calendar days with events have visual indicators
- ✅ Clicking calendar days shows schedule events
- ✅ Events display with proper formatting (grade, subject, time)
- ✅ Days with no events show appropriate messages
- ✅ Quick search functionality works
- ✅ Test 2.2 passes with high success rate

## Risk Mitigation

### Before Starting:
- Create backup of current working files
- Ensure test environment is properly set up
- Verify schedule.json data is valid

### During Implementation:
- Test each commit before moving to the next
- Keep commits small and focused
- Document any deviations from the plan

### Rollback Plan:
- Each commit can be reverted independently
- Keep notes of any manual changes needed
- Have original files available for reference

## Estimated Timeline

- **Commit 1**: 30-45 minutes
- **Commit 2**: 20-30 minutes  
- **Commit 3**: 45-60 minutes
- **Commit 4**: 30-45 minutes
- **Commit 5**: 15-20 minutes
- **Commit 6**: 20-30 minutes
- **Commit 7**: 30-45 minutes

**Total Estimated Time**: 3-4 hours

## Notes

- This plan assumes the current codebase structure is stable
- Additional commits may be needed for edge cases discovered during implementation
- Each commit should include appropriate commit messages explaining the changes
- Consider creating feature branch for this refactoring work

---

**Created**: [Current Date]  
**Last Updated**: [Current Date]  
**Status**: Ready for Implementation
