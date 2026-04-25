# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Netlify Deploy Configuration Conflict
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that conflicting netlify.toml files cause deployment failures (from Bug Condition in design)
  - Test that missing environment variables (GROQ_API_KEY, SMTP_USER, SMTP_PASS) cause API failures
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - API Endpoints and Frontend Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test that API endpoints (/api/groq/chat, /api/groq/smart-ai, /api/send-verification-code, /api/health) work when environment variables are present
  - Test that React client builds correctly to dist folder
  - Test that serverless functions serve from netlify/functions/api.js
  - Test that SPA routing (/*) redirects work correctly
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for Netlify deploy configuration conflicts and missing environment variables

  - [x] 3.1 Remove conflicting netlify.toml file
    - Delete client/netlify.toml to eliminate configuration conflict
    - Keep only root netlify.toml with correct build configuration
    - _Bug_Condition: isBugCondition(deployConfig) where conflicting netlify.toml files exist_
    - _Expected_Behavior: Single netlify.toml configuration from design_
    - _Preservation: API endpoints and build process from design_
    - _Requirements: 1.1, 1.4, 2.1_

  - [x] 3.2 Validate root netlify.toml configuration
    - Ensure build command is "npm --prefix client run build"
    - Ensure publish directory is "client/dist"
    - Ensure functions directory is "netlify/functions"
    - Ensure proper redirects for API and SPA routing
    - _Bug_Condition: isBugCondition(deployConfig) where build paths are incorrect_
    - _Expected_Behavior: expectedBehavior(result) from design_
    - _Preservation: Preservation Requirements from design_
    - _Requirements: 1.4, 2.1, 2.4_

  - [x] 3.3 Document environment variables setup
    - Create clear instructions for setting up required environment variables
    - Document GROQ_API_KEY, SMTP_USER, SMTP_PASS, RESEND_API_KEY requirements
    - Reference existing setup-netlify-env.ps1 script for automation
    - _Bug_Condition: isBugCondition(deployConfig) where environment variables are missing_
    - _Expected_Behavior: expectedBehavior(result) from design_
    - _Preservation: Preservation Requirements from design_
    - _Requirements: 1.2, 1.3, 2.2, 2.3_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Netlify Deploy Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - API Endpoints and Frontend Functionality
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.