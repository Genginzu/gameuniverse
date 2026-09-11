# Design Document: Settings Page

## Overview

La page paramètres permet aux utilisateurs authentifiés de gérer leurs
informations de compte. Elle est organisée en deux sections principales : Profil
(username, email) et Sécurité (mot de passe). La page utilise le système
d'authentification Supabase existant et suit les patterns de design de
l'application.

## Architecture

```mermaid
graph TB
    subgraph "Frontend"
        SP[Settings Page]
        SC[SettingsContent Component]
        UF[UsernameForm]
        EF[EmailForm]
        PR[PasswordResetButton]
    end

    subgraph "Hooks"
        UP[useProfile]
        UA[useAuth]
        UT[useToast]
    end

    subgraph "API Routes"
        PA[/api/profile PATCH]
    end

    subgraph "Supabase"
        AUTH[Auth Service]
        DB[(profiles table)]
    end

    SP --> SC
    SC --> UF
    SC --> EF
    SC --> PR

    UF --> UP
    EF --> AUTH
    PR --> UA

    UP --> PA
    PA --> DB
    UA --> AUTH
```

## Components and Interfaces

### Page Component

```typescript
// src/app/[locale]/settings/page.tsx
export default function SettingsPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <SettingsContent />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
```

### SettingsContent Component

```typescript
// src/components/settings/SettingsContent.tsx
interface SettingsContentProps {}

export function SettingsContent(): JSX.Element {
  // Uses useProfile hook for profile data
  // Uses useAuth hook for auth operations
  // Renders sections: Profile (username, email) and Security (password reset)
}
```

### UsernameForm Component

```typescript
// src/components/settings/UsernameForm.tsx
interface UsernameFormProps {
  currentUsername: string | null;
  onUpdate: (username: string) => Promise<void>;
  isLoading: boolean;
}

// Form with validation using react-hook-form + zod
// Validates: non-empty, trimmed
```

### EmailForm Component

```typescript
// src/components/settings/EmailForm.tsx
interface EmailFormProps {
  currentEmail: string;
  onUpdate: (email: string) => Promise<void>;
  isLoading: boolean;
}

// Form with email validation using react-hook-form + zod
// Calls supabase.auth.updateUser({ email }) which sends confirmation
```

### PasswordResetSection Component

```typescript
// src/components/settings/PasswordResetSection.tsx
interface PasswordResetSectionProps {
  userEmail: string;
  onRequestReset: () => Promise<void>;
  isLoading: boolean;
}

// Button that triggers password reset email via useAuth.resetPassword
```

## Data Models

### Profile (existing)

```typescript
interface Profile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  preferred_locale: string | null;
  created_at: string | null;
  updated_at: string | null;
}
```

### Form Schemas

```typescript
// Username validation schema
const usernameSchema = z.object({
  username: z
    .string()
    .min(1, "Le nom d'utilisateur est requis")
    .transform((val) => val.trim())
    .refine(
      (val) => val.length > 0,
      "Le nom d'utilisateur ne peut pas être vide"
    ),
});

// Email validation schema
const emailSchema = z.object({
  email: z.string().email("Format d'email invalide"),
});
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all
valid executions of a system—essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees._

### Property 1: Username validation rejects empty inputs

_For any_ string input that is empty or contains only whitespace characters, the
username form SHALL reject the submission and not call the update API.

**Validates: Requirements 2.1**

### Property 2: Username update round-trip consistency

_For any_ valid username (non-empty, trimmed string), after a successful update,
fetching the profile SHALL return the same username value.

**Validates: Requirements 2.2**

### Property 3: Email validation rejects invalid formats

_For any_ string input that does not match a valid email format (missing @,
invalid domain, etc.), the email form SHALL reject the submission and not call
the update API.

**Validates: Requirements 3.1**

### Property 4: Loading state during form submission

_For any_ form submission (username or email), WHILE the async operation is in
progress, the submit button SHALL display a loading indicator and be disabled.

**Validates: Requirements 5.1**

## Error Handling

### Client-Side Validation Errors

- Empty username: Display inline error "Le nom d'utilisateur est requis"
- Invalid email format: Display inline error "Format d'email invalide"
- Form errors use react-hook-form error state with red border and error message

### API Errors

- Network errors: Toast notification "Erreur de connexion. Veuillez réessayer."
- Email already in use: Toast notification "Cette adresse email est déjà
  utilisée"
- Generic server error: Toast notification "Une erreur s'est produite. Veuillez
  réessayer."
- Password reset failure: Toast notification with Supabase error message

### Success Feedback

- Username updated: Toast notification "Nom d'utilisateur mis à jour"
- Email update initiated: Toast notification "Un email de confirmation a été
  envoyé à votre nouvelle adresse"
- Password reset sent: Toast notification "Un email de réinitialisation a été
  envoyé"

## Testing Strategy

### Unit Tests

- Test form validation logic (username, email schemas)
- Test component rendering with different states (loading, error, success)
- Test error message display for validation failures

### Property-Based Tests

Using fast-check for TypeScript:

1. **Property 1**: Generate random whitespace strings, verify form rejects all
2. **Property 2**: Generate valid usernames, verify round-trip consistency
3. **Property 3**: Generate invalid email strings, verify form rejects all
4. **Property 4**: Verify loading state is shown during any async operation

### Integration Tests

- Test full flow: update username → verify profile updated
- Test email update triggers confirmation email (mock Supabase)
- Test password reset button triggers reset email (mock Supabase)

### Test Configuration

- Property tests: minimum 100 iterations per property
- Use fast-check library for property-based testing
- Tag format: **Feature: settings-page, Property {number}: {property_text}**
