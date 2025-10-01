# Test 7.2 Accessibility Refactoring Prompt

## Context
Based on the accessibility test results for the Schedule Editor application, the following refactoring prompt is provided to guide an AI Agent in improving the application's accessibility features.

## Test Results Summary
- **Overall Accessibility Score:** 63% (Needs Improvement)
- **Critical Issues:** 8 form inputs without labels, poor color contrast (69% failure rate), missing ARIA labels
- **Passing Areas:** Keyboard navigation (100%), basic browser compatibility (80%)

## Refactoring Instructions

### Primary Objective
Improve the Schedule Editor application's accessibility to meet WCAG 2.1 AA standards and achieve a minimum accessibility score of 85%.

### Specific Refactoring Tasks

#### 1. Form Label Implementation (HIGH PRIORITY)
**Current Issue:** 8 form inputs lack proper accessibility labels
**Target Elements:**
- `loginEmail` (email input)
- `loginPassword` (password input) 
- `signupName` (text input)
- `signupEmail` (email input)
- `signupPassword` (password input)
- `signupConfirmPassword` (password input)
- `signupTerms` (checkbox)
- `quickSearchInput` (text input)

**Required Actions:**
1. Add proper `<label>` elements with `for` attributes matching input IDs
2. Implement `aria-label` attributes for inputs that cannot have visible labels
3. Add `aria-describedby` for inputs that need additional context
4. Ensure all form fields have descriptive, accessible names

**Implementation Example:**
```html
<!-- Before -->
<input type="email" id="loginEmail" placeholder="Email">

<!-- After -->
<label for="loginEmail">Email Address</label>
<input type="email" id="loginEmail" aria-label="Email address for login" aria-required="true">
```

#### 2. Button Accessibility Enhancement (HIGH PRIORITY)
**Current Issue:** All 10 buttons lack ARIA labels
**Target Elements:**
- Sign In/Sign Up buttons
- Search button (🔍)
- Navigation buttons (< >)
- Edit Schedule button
- Search button
- Cancel/Save buttons

**Required Actions:**
1. Add `aria-label` attributes to all buttons
2. Implement `aria-describedby` for buttons that need context
3. Ensure icon buttons have descriptive labels
4. Add `role` attributes where appropriate

**Implementation Example:**
```html
<!-- Before -->
<button type="submit">🔍</button>

<!-- After -->
<button type="submit" aria-label="Search schedules" aria-describedby="search-help">🔍</button>
```

#### 3. Color Contrast Improvement (HIGH PRIORITY)
**Current Issue:** 69% of text elements fail contrast requirements
**Target Areas:**
- Headings (H1, H2, H3)
- Links and secondary text
- Calendar day labels
- Modal text elements

**Required Actions:**
1. Increase contrast ratios to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
2. Fix transparent backgrounds (`rgba(0, 0, 0, 0)`) on text elements
3. Ensure all interactive elements have sufficient contrast
4. Test contrast with color blindness simulators

**Implementation Example:**
```css
/* Before */
h2 { color: rgb(51, 51, 51); background-color: rgba(0, 0, 0, 0); }

/* After */
h2 { color: rgb(0, 0, 0); background-color: rgb(255, 255, 255); }
```

#### 4. Modal Accessibility Enhancement (MEDIUM PRIORITY)
**Current Issue:** Edit modal lacks proper ARIA attributes
**Target Element:** Edit Event modal

**Required Actions:**
1. Add `role="dialog"` to modal container
2. Implement `aria-modal="true"`
3. Add `aria-label` or `aria-labelledby` for modal title
4. Implement proper focus management
5. Add `aria-hidden="true"` to background elements when modal is open

**Implementation Example:**
```html
<!-- Before -->
<div class="modal">
  <h2>Edit Event</h2>
  <!-- modal content -->
</div>

<!-- After -->
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-description">
  <h2 id="modal-title">Edit Event</h2>
  <div id="modal-description" class="sr-only">Edit the details of this schedule event</div>
  <!-- modal content -->
</div>
```

#### 5. Link Accessibility Improvement (MEDIUM PRIORITY)
**Current Issue:** Links lack descriptive text or ARIA labels
**Target Elements:** All links in the application

**Required Actions:**
1. Add descriptive text to all links
2. Implement `aria-label` for links that need additional context
3. Ensure links are keyboard accessible
4. Add `aria-describedby` for links that need explanation

#### 6. Focus Management Enhancement (MEDIUM PRIORITY)
**Current Issue:** Some elements may need better focus indicators

**Required Actions:**
1. Implement visible focus indicators for all interactive elements
2. Ensure logical tab order throughout the application
3. Add `tabindex` attributes where necessary
4. Implement focus trapping in modals

### Implementation Guidelines

#### Code Quality Standards
1. **Semantic HTML:** Use proper HTML elements and attributes
2. **ARIA Best Practices:** Follow ARIA authoring guidelines
3. **Progressive Enhancement:** Ensure functionality works without JavaScript
4. **Testing:** Test with screen readers and keyboard navigation

#### Testing Requirements
1. **Manual Testing:** Test with keyboard navigation
2. **Screen Reader Testing:** Test with NVDA, JAWS, or VoiceOver
3. **Color Contrast Testing:** Use tools like WebAIM Contrast Checker
4. **Automated Testing:** Use axe-core or similar tools

#### File Modifications Required
Based on the test results, the following files likely need modification:
- `public/index.html` - Main page with login/signup forms
- `public/schedule-editor.html` - Schedule editor interface
- `public/search.html` - Search interface
- `public/css/styles.css` - Color contrast and focus styles
- `public/js/script.js` - Focus management and ARIA updates
- `public/js/editor.js` - Modal accessibility enhancements

### Success Criteria
The refactoring is considered successful when:
1. **Accessibility Score:** Achieves 85% or higher
2. **Form Labels:** All form inputs have proper labels
3. **Color Contrast:** All text meets WCAG AA contrast requirements
4. **ARIA Implementation:** All interactive elements have proper ARIA attributes
5. **Keyboard Navigation:** All functionality is accessible via keyboard
6. **Screen Reader Support:** Application is fully navigable with screen readers

### Validation Steps
After implementing the refactoring:
1. Run the accessibility test script again
2. Test with keyboard navigation only
3. Test with screen reader software
4. Validate color contrast ratios
5. Check ARIA implementation with browser dev tools
6. Verify focus management and tab order

### Additional Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe-core Accessibility Testing](https://github.com/dequelabs/axe-core)

## Expected Outcome
After implementing these refactoring changes, the Schedule Editor application should achieve:
- **Improved Accessibility Score:** 85%+ (up from 63%)
- **WCAG 2.1 AA Compliance:** Meeting modern accessibility standards
- **Better User Experience:** Enhanced usability for users with disabilities
- **Legal Compliance:** Meeting accessibility requirements for public applications

The refactoring should be implemented systematically, testing each change to ensure it improves accessibility without breaking existing functionality.
