# Implementation Plan: Settings Page

## Overview

Implémentation de la page paramètres permettant aux utilisateurs de modifier leur username, email et de demander un reset de mot de passe. L'implémentation suit les patterns existants du projet (DashboardLayout, hooks, composants UI).

## Tasks

- [ ] 1. Create settings page and base structure
  - [ ] 1.1 Create settings page at `src/app/[locale]/settings/page.tsx`
    - Use DashboardLayout wrapper
    - Add ErrorBoundary with ErrorFallback
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.2 Create SettingsContent component at `src/components/settings/SettingsContent.tsx`
    - Import useProfile and useAuth hooks
    - Create two Card sections: Profile and Security
    - Add loading skeleton state
    - _Requirements: 5.4, 5.5_

  - [ ] 1.3 Add translations for settings page in `src/messages/en.json` and `src/messages/fr.json`
    - Add settings section with all labels and messages
    - _Requirements: 5.5_

- [ ] 2. Implement username modification
  - [ ] 2.1 Create UsernameForm component at `src/components/settings/UsernameForm.tsx`
    - Use react-hook-form with zod validation
    - Validate non-empty, trimmed username
    - Display current username as default value
    - Show loading state on submit button
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1_

  - [ ]* 2.2 Write property test for username validation
    - **Property 1: Username validation rejects empty inputs**
    - **Validates: Requirements 2.1**

  - [ ]* 2.3 Write property test for username update round-trip
    - **Property 2: Username update round-trip consistency**
    - **Validates: Requirements 2.2**

- [ ] 3. Implement email modification
  - [ ] 3.1 Create EmailForm component at `src/components/settings/EmailForm.tsx`
    - Use react-hook-form with zod email validation
    - Call supabase.auth.updateUser({ email }) on submit
    - Display current email as default value
    - Show loading state and success/error toasts
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 5.1, 5.2, 5.3_

  - [ ]* 3.2 Write property test for email validation
    - **Property 3: Email validation rejects invalid formats**
    - **Validates: Requirements 3.1**

- [ ] 4. Implement password reset section
  - [ ] 4.1 Create PasswordResetSection component at `src/components/settings/PasswordResetSection.tsx`
    - Display button to request password reset
    - Use useAuth.resetPassword function
    - Show loading state and success/error toasts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_

- [ ] 5. Checkpoint - Ensure all components work together
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Integration and final touches
  - [ ] 6.1 Wire all components in SettingsContent
    - Connect UsernameForm with useProfile.updateProfile
    - Connect EmailForm with Supabase auth
    - Connect PasswordResetSection with useAuth.resetPassword
    - Add toast notifications for all operations
    - _Requirements: 5.2, 5.3_

  - [ ]* 6.2 Write property test for loading states
    - **Property 4: Loading state during form submission**
    - **Validates: Requirements 5.1**

  - [ ] 6.3 Create SettingsSkeleton component for loading state
    - Match the layout of SettingsContent
    - _Requirements: 5.5_

- [ ] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The existing useProfile hook already supports updateProfile for username changes
- Email changes require Supabase auth.updateUser which sends a confirmation email
- Password reset uses the existing resetPassword function in useAuth
