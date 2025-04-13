# Drone Companion PWA - Development Tasks

This document outlines the development tasks for the Drone Companion PWA. Tasks are grouped into logical phases.

## Phase 1: Foundation & Core Setup

*   [x] **TASK-FND-01:** Initialize PWA Project
    *   Description: Set up basic project structure (HTML, CSS, JS, `manifest.json`, basic `sw.js`).
    *   Sub-Tasks: Create folders, basic files. *(Vite created basic structure in `app/` directory)*
    *   Status: Completed *(Vite initialization provides sufficient baseline)*
    *   Difficulty: Low
    *   Dependencies: None
*   [x] **TASK-FND-02:** Decide JS Approach & Integrate
    *   Description: Choose between Vanilla JS or a lightweight framework (Vue, Svelte, React). Integrate the chosen approach.
    *   Status: Completed *(Decision: Vue.js with TypeScript using Vite, fully integrated)*
    *   Difficulty: Low-Medium
    *   Dependencies: TASK-FND-01
    *   Notes: This choice impacts subsequent UI/component tasks.
*   [x] **TASK-FND-03:** Implement Core App Layout & Navigation
    *   Description: Create main layout (`App.vue`) and navigation (`BottomNav.vue`). Implement basic placeholder views (`HomeView`, `DronesView`, etc.) and set up `vue-router`.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-01, TASK-FND-02
    *   Issues: Ensure navigation works, consider responsive design. *(Basic structure implemented)*.
*   [x] **TASK-FND-04:** Configure `manifest.json`
    *   Description: Set app name ("Drone Companion"), icons (placeholders created), start URL (`/`), display mode (`standalone`). Linked in `index.html`.
    *   Status: Completed
    *   Difficulty: Low
    *   Dependencies: TASK-FND-01
    *   Issues: Need appropriate icon sizes/formats. *(Directory `public/icons/` created, but requires actual icon files)*.
*   [x] **TASK-FND-05:** Implement Basic Service Worker (App Shell Caching)
    *   Description: Created `public/sw.js` with install (cache shell), activate (cleanup old caches), and fetch (cache-first) listeners. Registered in `main.ts`.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-01
    *   Issues: Basic caching strategy; requires adding build output files (JS/CSS) to `urlsToCache` later. Advanced offline needed for data (Phase 8).
*   [x] **TASK-FND-06:** Setup Testing Framework
    *   Description: Installed and configured Vitest with `@vue/test-utils` and `happy-dom`. Added test scripts to `package.json`. Created sample test (`BottomNav.spec.ts`).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-01, TASK-FND-02
    *   Issues: Ensuring framework compatibility with chosen JS approach/framework. *(Vitest chosen for Vite compatibility)*.
*   [x] **TASK-FND-07:** Define Core Data Structures
    *   Description: Defined TypeScript interfaces (`DroneProfile`, `ChecklistItem`, `Checklist`, `FlightLog`, `UnlockedAchievement`) in `src/types/data.ts`.
    *   Status: Completed
    *   Difficulty: Low
    *   Dependencies: TASK-FND-02
*   [x] **TASK-FND-08:** Setup Initial IndexedDB Stores
    *   Description: Implement IndexedDB setup logic to create object stores for `drones`, `checklists`, `flightLogs`, `achievements`.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-05 (conceptually, as SW might interact), TASK-FND-07

## Phase 2: Drone Profile Management

*   [x] **TASK-DRN-01:** Implement Drone Profile CRUD Functions
    *   Description: Create functions (`addDrone`, `getDrone`, `getAllDrones`, `updateDrone`, `deleteDrone`) interacting with the `drones` IndexedDB store.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-07, TASK-FND-08
*   [x] **TASK-DRN-02:** Write Unit Tests for Drone Profile CRUD
    *   Description: Create unit tests (using framework from TASK-FND-06) for the functions in TASK-DRN-01. Cover success, failure, and edge cases (e.g., duplicates, invalid data).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-06, TASK-DRN-01
    *   Issues: Mocking IndexedDB, testing async operations.
*   [x] **TASK-DRN-03:** Implement Drone List Screen UI
    *   Description: Create the UI component/view to display a list of saved drone profiles.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-03, TASK-DRN-01
*   [x] **TASK-DRN-04:** Implement Drone Add/Edit Form UI
    *   Description: Create the UI component/view for the form to add or edit a drone profile.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-03, TASK-FND-07
*   [x] **TASK-DRN-05:** Implement Drone Form Submission Logic
    *   Description: Write the JS logic to handle form submission, validate input, and call the appropriate CRUD function (TASK-DRN-01).
    *   Status: Completed (as part of TASK-DRN-04)
    *   Difficulty: Medium
    *   Dependencies: TASK-DRN-01, TASK-DRN-04
*   [x] **TASK-DRN-06:** (Optional) Implement Drone Photo Upload/Association
    *   Description: Add functionality to upload/link a photo to a drone profile (consider storage implications - IndexedDB blob or link to external?). **Update:** Implemented using Data URL stored in IndexedDB. Added file input, preview, and validation to `DroneForm.vue`. Updated `DroneProfile` type. Updated `DronesView.vue` to display thumbnails.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-DRN-04, TASK-DRN-05

## Phase 3: Checklist Functionality

*   [x] **TASK-CHK-01:** Implement Checklist CRUD Functions
    *   Description: Create functions for managing checklists and their items in the `checklists` IndexedDB store.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-07, TASK-FND-08
*   [x] **TASK-CHK-02:** Write Unit Tests for Checklist CRUD
    *   Description: Create unit tests for the functions in TASK-CHK-01. Cover creation, reading, updating (items), deletion, error handling.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-06, TASK-CHK-01
    *   Issues: Testing nested item operations.
*   [x] **TASK-CHK-03:** Implement Default Checklist Template Logic
    *   Description: Add logic to create/manage predefined checklist templates (e.g., "Pre-Flight", "Post-Flight").
    *   Status: Completed
    *   Difficulty: Low-Medium
    *   Dependencies: TASK-CHK-01
*   [x] **TASK-CHK-04:** Implement Checklist Management UI
    *   Description: Create UI for viewing, creating, editing, deleting checklists (potentially linked to drones or as templates).
    *   Status: Completed
    *   Difficulty: Medium-High
    *   Dependencies: TASK-DRN-03 (for linking), TASK-CHK-01, TASK-CHK-03
*   [x] **TASK-CHK-05:** Implement Logic to Associate Checklist with Drone
    *   Description: Allow associating a specific (or default) checklist with a Drone Profile. Update Drone data structure/CRUD if needed.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-DRN-01, TASK-DRN-05, TASK-CHK-04
*   [x] **TASK-CHK-06:** Implement Active Checklist Display UI
    *   Description: Design and implement the screen/component for displaying the active checklist items for a selected drone before a flight.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-03, TASK-FND-07, TASK-CHK-05
*   [x] **TASK-CHK-07:** Implement Active Checklist Interaction Logic
    *   Description: Write JS logic to load the correct checklist for the selected drone, track the checked state of items.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-CHK-01, TASK-CHK-05, TASK-CHK-06
*   [x] **TASK-CHK-08:** Implement "Complete Checklist & Start Log" Logic
    *   Description: Enable the "Start Log" button only when all checklist items are checked. Handle the transition/navigation to the flight log entry screen.
    *   Status: Completed
    *   Difficulty: Low-Medium
    *   Dependencies: TASK-CHK-07
*   [x] **TASK-CHK-09:** Define Test Cases for Checklist Completion UI
    *   Description: Specify test scenarios for the active checklist UI (TASK-CHK-06/08): displaying items, checking/unchecking, button enablement, navigation on completion. (Guides manual/E2E testing).
    *   Status: Completed
    *   Difficulty: Low-Medium
    *   Dependencies: TASK-CHK-08
    *   Issues: Defining UI states and interactions clearly.
    *   Test Cases:
        *   **TC-CHK-UI-01:** Verify checklist loads correctly for drone with assigned default checklist.
            *   Steps: Navigate to Drones list, Click 'Pre-Flight' on a drone with a default checklist.
            *   Expected: Active Checklist view loads, displays correct drone name and checklist name, shows list of items, 'Start Log' button is disabled.
        *   **TC-CHK-UI-02:** Verify error message shown for drone without assigned default checklist.
            *   Steps: Navigate to Drones list, Ensure 'Pre-Flight' button is disabled/shows tooltip for a drone without default checklist. (Button should ideally be disabled per TASK-CHK-06 implementation).
            *   *Alternative (if button not disabled):* Click 'Pre-Flight' on drone without default.
            *   Expected: Active Checklist view shows an error message indicating no default checklist is assigned.
        *   **TC-CHK-UI-03:** Verify checklist item checking/unchecking works.
            *   Steps: Load active checklist, Click checkbox for an item, Click again.
            *   Expected: Checkbox state toggles, Text style changes (e.g., line-through).
        *   **TC-CHK-UI-04:** Verify 'Start Log' button enables only when all items are checked.
            *   Steps: Load active checklist, Check all items one by one.
            *   Expected: Button remains disabled until the last item is checked, then enables.
        *   **TC-CHK-UI-05:** Verify 'Start Log' button disables if an item is unchecked.
            *   Steps: Load active checklist, Check all items, Uncheck one item.
            *   Expected: Button enables when all checked, disables when one is unchecked.
        *   **TC-CHK-UI-06:** Verify navigation to Log Entry screen on button click (when enabled).
            *   Steps: Load active checklist, Check all items, Click 'Start Flight Log' button.
            *   Expected: Navigates to 'Add Flight Log' view, URL includes correct droneId and checklistId as query parameters.
        *   **TC-CHK-UI-07:** Verify behavior with empty checklist.
            *   Steps: Assign an empty checklist to a drone, Navigate to Active Checklist view.
            *   Expected: View loads, shows message "This checklist has no items", 'Start Log' button is disabled.
        *   **TC-CHK-UI-08:** Verify back button functionality.
            *   Steps: Load active checklist, Click 'Back' button.
            *   Expected: Navigates back to the Drones list view.

## Phase 4: Flight Logging

*   [x] **TASK-LOG-01:** Implement Flight Log CRUD Functions
    *   Description: Create functions for managing flight logs in the `flightLogs` IndexedDB store.
    *   Status: Completed
    *   Difficulty: Medium-High (consider offline implications early)
    *   Dependencies: TASK-FND-07, TASK-FND-08
*   [x] **TASK-LOG-02:** Write Unit Tests for Flight Log CRUD (Basic)
    *   Description: Create unit tests for the functions in TASK-LOG-01 (initially focus on online scenarios).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-06, TASK-LOG-01
*   [x] **TASK-LOG-03:** Implement Flight Log Entry Form UI
    *   Description: Design and implement the UI form component for entering flight log details (drone used, date, time, location, duration, weather, notes).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-03, TASK-FND-07, TASK-DRN-01 (to select drone)
*   [x] **TASK-LOG-04:** Implement Flight Log Form Save Logic
    *   Description: Write JS logic for the "Save Flight Log" button, collecting form data and calling TASK-LOG-01.
    *   Status: Completed (as part of TASK-LOG-03)
    *   Difficulty: Medium
    *   Dependencies: TASK-LOG-01, TASK-LOG-03
*   [x] **TASK-LOG-05:** (Optional) Integrate Browser Geolocation API
    *   Description: Add a button/feature to fetch and populate the current location using the Geolocation API.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-LOG-03
*   [x] **TASK-LOG-06:** Define Test Cases for Log Form UI
    *   Description: Specify test scenarios for the log entry form (TASK-LOG-03): pre-filling data, data entry, validation, weather selection, Geolocation interaction (TASK-LOG-05), AI interaction (TASK-AI-04, TASK-AI-05), successful save (TASK-LOG-04).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-LOG-03, TASK-LOG-04, TASK-LOG-05
    *   Test Cases:
        *   **TC-LOG-UI-01:** Verify form loads with drone pre-selected (from checklist completion).
            *   Steps: Complete checklist via ActiveChecklistView, Click 'Start Flight Log'.
            *   Expected: Log form loads, correct Drone is pre-selected in dropdown, Drone Name field is populated.
        *   **TC-LOG-UI-02:** Verify form loads with default date (today).
            *   Steps: Navigate to Log Form directly (if possible) or via checklist.
            *   Expected: Date field defaults to the current date.
        *   **TC-LOG-UI-03:** Verify required fields validation.
            *   Steps: Load form, Attempt to save without selecting drone / entering date / entering duration.
            *   Expected: Save button is disabled, appropriate validation messages might appear (though current implementation just disables button).
        *   **TC-LOG-UI-04:** Verify duration validation (minimum 1).
            *   Steps: Load form, Enter 0 or negative number in duration, Attempt to save.
            *   Expected: Save button is disabled (due to `isFormValid` check).
        *   **TC-LOG-UI-05:** Verify successful data entry and save.
            *   Steps: Load form, Select drone, Enter valid date, Enter valid duration, Fill optional fields (location, weather, notes), Click Save.
            *   Expected: Saving indicator appears, Navigates to History view, New log appears in history (Verification requires TASK-HIS-01). Data in log matches entered data (Verification requires TASK-HIS-03).
        *   **TC-LOG-UI-06:** Verify Geolocation button retrieves coordinates.
            *   Steps: Load form, Click Geolocation button (grant permission if prompted).
            *   Expected: 'Locating...' shown, Coordinates appear below input, Location Name field might be auto-populated with coordinates.
        *   **TC-LOG-UI-07:** Verify Geolocation button error handling (Permission Denied).
            *   Steps: Load form, Click Geolocation button, Deny permission prompt.
            *   Expected: Error message "Geolocation permission denied." appears below input.
        *   **TC-LOG-UI-08:** Verify Geolocation button error handling (Unavailable/Timeout).
            *   Steps: Load form, Use browser dev tools to simulate geolocation error (unavailable/timeout), Click button.
            *   Expected: Appropriate error message appears.
        *   **TC-LOG-UI-09:** Verify Cancel button navigates back.
            *   Steps: Load form, Click Cancel button.
            *   Expected: Navigates back to the previous view (ActiveChecklistView or potentially DronesView).
        *   **TC-LOG-UI-10:** Verify Save error handling.
            *   Steps: Load form, Fill required fields, Use browser dev tools to make IndexedDB unavailable (e.g., block requests), Click Save.
            *   Expected: Saving indicator appears, then error message appears below form (e.g., "Error saving log: ...").
        *   **(Future) TC-LOG-UI-AI-01:** Verify AI Weather Comment button works.
            *   Steps: Load form, Select weather, Click AI comment button.
            *   Expected: Loading indicator, AI comment appears.
        *   **(Future) TC-LOG-UI-AI-02:** Verify AI Location Tip works.
            *   Steps: Load form, Enter/fetch location, Click AI tip button.
            *   Expected: Loading indicator, AI tip appears.

## Phase 5: Flight History & Details

*   [x] **TASK-HIS-01:** Implement Flight History List Screen UI
    *   Description: Design and implement the UI screen to list past flight logs, likely sorted by date descending.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-03, TASK-LOG-01
*   [x] **TASK-HIS-02:** Implement History List Filtering Logic
    *   Description: Add controls (e.g., dropdown) to filter the history list by drone. Update the displayed list based on filters.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-HIS-01, TASK-DRN-01 (to get drone list for filter)
*   [x] **TASK-HIS-03:** Implement Flight Log Detail View UI
    *   Description: Design and implement the UI screen to display the full details of a selected flight log entry.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-HIS-01, TASK-LOG-01
*   [x] **TASK-HIS-04:** Implement Edit/Delete Functionality for Logs
    *   Description: Add buttons/logic within the detail view (TASK-HIS-03) or list view (TASK-HIS-01) to edit or delete a specific flight log entry.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-HIS-03, TASK-LOG-01, TASK-LOG-03 (modified)
*   [x] **TASK-HIS-05:** Define Test Cases for History & Details UI
    *   Description: Specify test scenarios: displaying history, applying filters, navigating to details, verifying detail data, using edit/delete functions (TASK-HIS-04).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-HIS-01, TASK-HIS-02, TASK-HIS-03, TASK-HIS-04
    *   Test Cases:
        *   **TC-HIS-UI-01:** Verify history list displays logs correctly (sorted descending by date).
            *   Steps: Ensure multiple logs exist. Navigate to History view.
            *   Expected: List shows logs with Date, Drone Name, Duration. Most recent log is at the top.
        *   **TC-HIS-UI-02:** Verify empty state message when no logs exist.
            *   Steps: Ensure no logs exist. Navigate to History view.
            *   Expected: Shows message "No flight logs recorded yet" and "Record First Flight" button.
        *   **TC-HIS-UI-03:** Verify drone filter dropdown populates correctly.
            *   Steps: Ensure multiple drones exist. Navigate to History view.
            *   Expected: Dropdown shows "All Drones" and names of all existing drones.
        *   **TC-HIS-UI-04:** Verify filtering by a specific drone works.
            *   Steps: Ensure logs exist for multiple drones. Select a specific drone from the filter dropdown.
            *   Expected: Only logs associated with the selected drone are displayed.
        *   **TC-HIS-UI-05:** Verify filtering back to "All Drones" works.
            *   Steps: Filter by a specific drone. Select "All Drones" from the filter dropdown.
            *   Expected: All logs are displayed again, sorted by date.
        *   **TC-HIS-UI-06:** Verify navigation to Detail view works.
            *   Steps: Navigate to History view. Click 'Details' button on a log item.
            *   Expected: Navigates to the Log Detail view (`/history/:logId`), URL contains the correct log ID.
        *   **TC-HIS-UI-07:** Verify Log Detail view displays correct data.
            *   Steps: Create a log with known data (drone, date, duration, location, weather, notes). Navigate to its Detail view.
            *   Expected: All fields (Drone Name, Date, Duration, Location Name, Coords (if available), Weather Condition, Temp (if available), Notes) match the original log data.
        *   **TC-HIS-UI-08:** Verify navigation to Edit view works from Detail view.
            *   Steps: Navigate to a Log Detail view. Click 'Edit' button.
            *   Expected: Navigates to the Log Form view (`/log/edit/:logId`), URL contains correct log ID. Form title is "Edit Flight Log".
        *   **TC-HIS-UI-09:** Verify Log Form pre-fills correctly in Edit mode.
            *   Steps: Navigate to Edit view for a known log (as in TC-HIS-UI-08).
            *   Expected: All form fields (Drone dropdown, Date, Duration, Location, Weather, Notes) are pre-filled with the log's data.
        *   **TC-HIS-UI-10:** Verify editing and saving a log works.
            *   Steps: Navigate to Edit view. Change a field (e.g., Notes). Click 'Update Log'.
            *   Expected: Navigates back to the Log Detail view. The updated data is displayed.
        *   **TC-HIS-UI-11:** Verify delete confirmation prompt appears.
            *   Steps: Navigate to a Log Detail view. Click 'Delete' button.
            *   Expected: A confirmation dialog appears asking to confirm deletion.
        *   **TC-HIS-UI-12:** Verify cancelling deletion works.
            *   Steps: Navigate to Detail view. Click 'Delete'. Click 'Cancel' (or equivalent) on the confirmation dialog.
            *   Expected: Remain on the Log Detail view. Log is not deleted.
        *   **TC-HIS-UI-13:** Verify confirming deletion works.
            *   Steps: Navigate to Detail view. Click 'Delete'. Click 'OK' (or equivalent) on the confirmation dialog.
            *   Expected: Navigates back to the History list view. The deleted log is no longer present in the list.

## Phase 6: Statistics

*   [x] **TASK-STA-01:** Implement Statistics Calculation Functions
    *   Description: Write JS functions to query flight logs (TASK-LOG-01) and drone data (TASK-DRN-01) to calculate statistics (e.g., total flights, total time, time per drone, flights per drone).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-LOG-01, TASK-DRN-01, TASK-FND-07 (added stats types)
*   [x] **TASK-STA-02:** Write Unit Tests for Statistics Calculations
    *   Description: Create unit tests for the functions in TASK-STA-01. Cover scenarios with no logs, single/multiple logs, different drones, edge cases (zero duration).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-06, TASK-STA-01
    *   Issues: Preparing mock data, testing aggregation.
*   [x] **TASK-STA-03:** Implement Statistics Display UI
    *   Description: Design and implement the UI screen for displaying calculated statistics.
    *   Status: Completed
    *   Difficulty: Low
    *   Dependencies: TASK-FND-03, TASK-STA-01
*   [x] **TASK-STA-04:** Implement Dynamic Update Logic for Stats UI
    *   Description: Ensure the Stats UI updates automatically when underlying data (flight logs) changes.
    *   Status: Completed (via onMounted fetch + Refresh button)
    *   Difficulty: Low-Medium
    *   Dependencies: TASK-STA-01, TASK-STA-03

## Phase 7: Achievement System

*   [x] **TASK-ACH-01:** Define Achievement Criteria & Data Structure
    *   Description: Define achievement criteria (e.g., "First Flight", "10 Flights", "1 Hour Total Time") and thresholds in JS. Define structure for storing unlocked achievements.
    *   Status: Completed
    *   Difficulty: Low-Medium
    *   Dependencies: TASK-FND-02
*   [x] **TASK-ACH-02:** Implement Achievement CRUD Functions
    *   Description: Create functions to check if an achievement is unlocked and save unlocked achievements to the `achievements` IndexedDB store.
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-08, TASK-ACH-01
*   [x] **TASK-ACH-03:** Implement Achievement Unlocking Logic
    *   Description: Write JS logic that runs after saving a flight log (hook into TASK-LOG-04) to check statistics (TASK-STA-01) against achievement criteria (TASK-ACH-01) and unlock new achievements using TASK-ACH-02.
    *   Status: Completed
    *   Difficulty: Medium-High
    *   Dependencies: TASK-LOG-04, TASK-STA-01, TASK-ACH-01, TASK-ACH-02
*   [x] **TASK-ACH-04:** Write Unit Tests for Achievement Unlocking Logic
    *   Description: Create unit tests for the checking logic in TASK-ACH-03. Use mock data (logs, stats, existing achievements) to simulate conditions for unlocking and not unlocking various achievements. Enhanced test coverage to include drone-specific achievements, weekend_warrior achievement, location_scout achievement, and comprehensive error handling tests.
    *   Status: Completed
    *   Difficulty: Medium-High
    *   Dependencies: TASK-FND-06, TASK-ACH-03, TASK-ACH-01, TASK-ACH-02, TASK-STA-01
    *   Issues: Setting up complex mock data states.
    *   Implementation Notes: 
        * Added specific tests for drone-specific achievement unlocking logic
        * Added tests for weekend_warrior achievement (Saturday/Sunday flights)
        * Added tests for location_scout achievement (flights in 3+ locations)
        * Added comprehensive error handling tests for database operations
        * Ensured tests for previously unlocked achievements work correctly
*   [x] **TASK-ACH-05:** Implement Achievements Display UI
    *   Description: Design and implement the UI screen to display earned achievements (potentially showing locked ones too).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: TASK-FND-03, TASK-ACH-02, TASK-ACH-01
*   [x] **TASK-ACH-06:** Implement Achievement Notification Logic
    *   Description: Implement a simple notification mechanism (e.g., a toast message) to inform the user when an achievement is unlocked (triggered by TASK-ACH-03).
    *   Status: Completed (using simple alert)
    *   Difficulty: Low-Medium
    *   Dependencies: TASK-ACH-03

## Phase 8: Advanced Features & Refinement

*   [x] **TASK-ADV-01:** Implement Robust Offline Data Handling
    *   Description: Enhance service worker (`sw.js`) and IndexedDB interactions (TASK-LOG-01, potentially others) for robust offline data saving. **Update:** Basic offline saving to IndexedDB is functional due to standard IndexedDB behavior and `vite-plugin-pwa` caching the app shell/scripts. Data can be added (e.g., flight logs) while offline and persists. Advanced strategies like background *sync* (to a backend) or complex queueing for failed *IndexedDB* writes (which are generally reliable offline) are not implemented as part of this task.
    *   Status: Completed (Basic Offline Save via IndexedDB/PWA Cache Confirmed)
    *   Difficulty: High (Advanced sync/queueing would be High)
    *   Dependencies: TASK-FND-05, TASK-LOG-01
    *   Implementation Notes:
        * Verified that the app works offline through standard IndexedDB operations
        * Confirmed data persistence through browser reload when offline
        * Added comprehensive unit tests for achievement persistence
*   [x] **TASK-ADV-02:** Write Unit Tests for Offline Data Persistence
    *   Description: Create unit tests specifically designed to verify that data saved while simulating offline conditions (using mocks or specific test setups) persists correctly via TASK-ADV-01. **Update:** Added tests (`flightLogService.spec.ts`) using existing mock DB to simulate offline add/update/delete/get operations, verifying data persistence.
    *   Status: Completed
    *   Difficulty: High (Initial setup was complex, simulation was straightforward)
    *   Dependencies: TASK-FND-06, TASK-LOG-02, TASK-ADV-01
    *   Issues: Complex test setup required.
*   [x] **TASK-ADV-03:** Apply Consistent Styling & Responsiveness
    *   Description: Apply consistent CSS styling across all screens/components. Ensure the application layout and elements adapt correctly to different screen sizes (mobile-first approach recommended).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: All UI tasks (Phases 1-7)
*   [x] **TASK-ADV-04:** Refine UI/UX Polish
    *   Description: Review and refine UI interactions, add subtle transitions/animations, improve loading states, and ensure overall user experience is smooth.
    *   Status: Completed
    *   Difficulty: Low-Medium
    *   Dependencies: TASK-ADV-03

## Phase 9: AI Integration (Optional - Requires Gemini API Access)

*   [ ] **TASK-AI-01:** Set Up Backend for Secure API Calls
    *   Description: Create a secure backend mechanism (e.g., Cloud Function, serverless endpoint) to handle Google AI Studio API calls, protecting the API key.
    *   Difficulty: Medium-High
    *   Dependencies: None (External setup)
*   [ ] **TASK-AI-02:** Implement Frontend API Client
    *   Description: Implement frontend JS function(s) to securely call the backend endpoint (TASK-AI-01). Handle request/response cycle, loading states, and errors.
    *   Difficulty: Medium
    *   Dependencies: TASK-AI-01
*   [ ] **TASK-AI-03:** Integrate "AI Flight Summary"
    *   Description: Add a feature (e.g., button) on the flight log detail screen (TASK-HIS-03) to generate an AI summary of the flight based on log data. Display the summary.
    *   Difficulty: Medium
    *   Dependencies: TASK-HIS-03, TASK-AI-02
*   [ ] **TASK-AI-04:** Integrate "AI Weather Comment"
    *   Description: Add a feature to the flight log entry form (TASK-LOG-03) to generate an AI comment based on selected weather conditions.
    *   Difficulty: Medium
    *   Dependencies: TASK-LOG-03, TASK-AI-02
*   [ ] **TASK-AI-05:** Integrate "AI Location Tip"
    *   Description: Add a feature to the flight log entry form (TASK-LOG-03), possibly triggered after location entry/fetch (TASK-LOG-05), to provide an AI-generated tip or observation about the location.
    *   Difficulty: Medium
    *   Dependencies: TASK-LOG-03, TASK-AI-02, (TASK-LOG-05)
*   [ ] **TASK-AI-06:** Define Test Cases for AI Features UI/API
    *   Description: Specify test scenarios: UI element presence, triggering API calls, loading states, displaying responses (success/error), offline behavior (disabled/error).
    *   Difficulty: Medium
    *   Dependencies: TASK-AI-03, TASK-AI-04, TASK-AI-05
    *   Issues: Mocking API responses.

## Phase 10: Final Testing & Deployment

*   [x] **TASK-DEP-01:** Define Detailed E2E & Offline Test Scenarios
    *   Description: Write step-by-step user scenarios covering all major features (drone add, checklist use, flight log, history, stats, achievements) and critical offline interactions (offline save, offline load).
    *   Status: Completed
    *   Difficulty: Medium
    *   Dependencies: All implemented features
    *   Issues: Ensuring comprehensive coverage.
    *   Scenarios:
        *   **E2E-SCN-01: Full Drone & Flight Workflow**
            1.  Navigate to Drones tab.
            2.  Add a new Drone profile (e.g., "Test Drone 1", model "Test Model"). Verify it appears in the list.
            3.  Edit the new drone, add notes ("Test notes"). Verify update.
            4.  Navigate to Checklists tab.
            5.  Create a new Checklist template ("Test Pre-Flight", add 3 items: "Check Battery", "Check Props", "Check GPS"). Verify it appears.
            6.  Assign the "Test Pre-Flight" template as the default for "Test Drone 1" (via Drone Edit screen or Checklist screen if implemented).
            7.  Navigate back to Drones tab.
            8.  Select "Pre-Flight" for "Test Drone 1".
            9.  Verify Active Checklist screen loads with correct drone/checklist name and items.
            10. Check all items. Verify "Start Flight Log" button enables.
            11. Click "Start Flight Log".
            12. Verify Log Form loads with "Test Drone 1" pre-selected.
            13. Fill in required fields: Date (today), Duration (10 mins).
            14. Optional: Use Geolocation button. Verify coords appear.
            15. Optional: Add Location Name ("Test Park"), Weather (Sunny), Notes ("Test flight notes").
            16. Click "Save Log".
            17. Verify navigation to History tab.
            18. Verify the new log appears at the top of the history list with correct info.
            19. Navigate to Stats tab. Verify Total Flights = 1, Total Time = 10 min, Avg Time = 10 min. Verify "Test Drone 1" stats show 1 flight / 10 min.
            20. Navigate to Achievements tab. Verify "First Flight" achievement is unlocked.
            21. Navigate back to History tab. Click "Details" on the log.
            22. Verify Log Detail screen shows all entered data correctly.
            23. Click "Edit". Verify Log Form loads pre-filled.
            24. Change Notes ("Updated notes"). Click "Update Log".
            25. Verify back on Log Detail screen with updated notes.
            26. Click "Delete". Confirm the dialog.
            27. Verify back on History screen. Verify log is gone.
            28. Navigate to Stats tab. Verify stats are updated (0 flights, 0 time).
            29. Navigate back to Drones tab. Delete "Test Drone 1". Confirm.
            30. Verify drone is removed from the list.
        *   **E2E-SCN-02: Offline Data Viewing**
            1.  Ensure some drones, checklists, logs, and unlocked achievements exist.
            2.  Enable browser offline mode (DevTools > Network > Offline).
            3.  Reload the application.
            4.  Navigate to Drones tab. Verify existing drones are displayed.
            5.  Navigate to Checklists tab. Verify existing checklists/templates are displayed.
            6.  Navigate to History tab. Verify existing logs are displayed.
            7.  Navigate to Stats tab. Verify previously calculated stats are displayed (or loading state persists if calculation requires online?). *Note: Current implementation recalculates on load, so this might show error/loading offline.*
            8.  Navigate to Achievements tab. Verify unlocked achievements are displayed.
            9.  Disable offline mode.
        *   **E2E-SCN-03: Offline Log Creation (Basic)**
            1.  Ensure at least one drone exists.
            2.  Enable browser offline mode.
            3.  Navigate to Drones tab. Select "Pre-Flight" for a drone.
            4.  Check all items, click "Start Flight Log".
            5.  Fill in required log details.
            6.  Click "Save Log".
            7.  Expected Behavior (Current): Save button likely attempts IndexedDB write. If successful, user *might* be navigated optimistically to History (or stay on form). An error message might appear if DB write fails *unexpectedly*, but standard offline should allow write.
            8.  Disable offline mode.
            9.  Navigate to History tab.
            10. Verify the log saved offline is now present in the list.
            11. Navigate to Stats/Achievements. Verify they reflect the new log.
        *   **E2E-SCN-04: Multi-Drone Stats & Achievements**
            1. Add Drone A, Drone B.
            2. Log 2 flights for Drone A (10 min, 15 min).
            3. Log 1 flight for Drone B (20 min).
            4. Check Stats: Total Flights=3, Total Time=45m, Avg=15m. Drone A: 2 flights, 25m total, 12.5m avg. Drone B: 1 flight, 20m total, 20m avg.
            5. Check Achievements: First Flight unlocked.
            6. Log 3 more flights for Drone A (total 5 for A). Total flights = 6.
            7. Check Stats: Update correctly. Drone A: 5 flights.
            8. Check Achievements: Getting Started unlocked.
            9. Log flights until Drone A has 10 flights.
            10. Check Achievements: Drone Specialist (Drone A) unlocked.
            11. Log flights until total time > 60 mins.
            12. Check Achievements: Air Time Apprentice unlocked.
*   [ ] **TASK-DEP-02:** Perform Manual End-to-End Testing *(Requires Human Intervention)*
    *   Description: Execute the scenarios from TASK-DEP-01 on target devices/browsers. Record bugs/issues. Achievement system tests completed with comprehensive unit test coverage.
    *   Status: In Progress
    *   Difficulty: Medium
    *   Dependencies: All implemented features, TASK-DEP-01
    *   Issues: Requires target devices/emulators. Time-consuming.
    *   Progress Notes:
        * Achievement system testing completed with extensive unit test coverage
        * Added tests for specific achievement types (drone-specific, time-based, location-based)
        * Error handling tests implemented for database operations
*   [ ] **TASK-DEP-03:** Perform Manual Offline Scenario Testing *(Requires Human Intervention)*
    *   Description: Execute the offline scenarios from TASK-DEP-01 using dev tools (offline checkbox) and airplane mode. Verify data persistence (IndexedDB) and graceful failure of online features.
    *   Status: Pending
    *   Difficulty: High
    *   Dependencies: TASK-DEP-02, TASK-ADV-01, TASK-DEP-01
    *   Issues: Reliably simulating transitions, verifying storage state.
*   [ ] **TASK-DEP-04:** Prepare PWA for Deployment *(Requires Human Intervention)*
    *   Description: Final checks, build process (if using framework tooling), ensure necessary icons and manifest details are final.
    *   Status: Pending
    *   Difficulty: Low-Medium
    *   Dependencies: All implemented features.
*   [ ] **TASK-DEP-05:** Deploy Application *(Requires Human Intervention)*
    *   Description: Deploy application files (HTML, CSS, JS, manifest, sw.js) to hosting. Deploy backend function (TASK-AI-01) if used.
    *   Status: Pending
    *   Difficulty: Low-Medium
    *   Dependencies: TASK-DEP-04, (TASK-AI-01)
*   [ ] **TASK-DEP-06:** Test Deployed PWA *(Requires Human Intervention)*
    *   Description: Perform smoke tests and key scenario checks on the deployed PWA to ensure it functions correctly in the production environment.
    *   Status: Pending
    *   Difficulty: Medium
    *   Dependencies: TASK-DEP-05
