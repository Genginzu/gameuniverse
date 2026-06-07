# Development Guide - Game Universe

## Bun Runtime Configuration

This project is optimized for **Bun** runtime to provide superior development
performance:

### Performance Benefits

- **10-25x faster** package installation compared to npm/yarn
- **Ultra-fast** Next.js development server startup
- **Native TypeScript** transpilation without additional configuration
- **Integrated test runner** compatible with Jest ecosystem
- **Built-in bundler** for optimized builds

## Development Scripts

All scripts are optimized to use Bun runtime:

```bash
# Development
bun run dev          # Start Next.js dev server with Bun
bun run build        # Build for production with Bun
bun run start        # Start production server with Bun

# Code Quality
bun run lint         # Run ESLint with Bun
bun run lint:fix     # Fix ESLint issues automatically
bun run format       # Format code with Prettier
bun run format:check # Check code formatting
bun run type-check   # Run TypeScript type checking

# Testing
bun run test         # Run tests with Bun test runner
bun run test:watch   # Run tests in watch mode
bun run test:run     # Run tests once (for CI)
bun run test:coverage # Run tests with coverage report

# Utilities
bun run clean        # Clean build artifacts
bun run check-all    # Run all quality checks (Windows)
bun run check-all:unix # Run all quality checks (Unix/Linux/macOS)
```

## Configuration Files

### bunfig.toml

Bun's main configuration file optimized for:

- Fast package installation with caching
- Development server optimizations
- Test runner configuration with coverage
- Build optimizations for production

### bun.config.ts

TypeScript configuration for Bun covering:

- Test setup with DOM environment
- Build configuration for browser target
- Development server with hot reload
- Coverage reporting and thresholds

### ESLint Configuration (eslint.config.js)

Modern flat config with:

- TypeScript support with proper parser
- Bun globals recognition
- React/Next.js compatibility
- Test environment globals (describe, it, expect, fc)
- Prettier integration

### Prettier Configuration (.prettierrc)

Code formatting with:

- Tailwind CSS plugin for class sorting
- Consistent formatting rules
- File-specific overrides for JSON and Markdown

## Code Quality Workflow

Since we keep things simple without Git hooks, here's the recommended workflow:

### Before Committing

Run the comprehensive check script:

```bash
# Windows
bun run check-all

# Unix/Linux/macOS
bun run check-all:unix
```

This will run:

1. **ESLint** - Code quality and consistency checks
2. **Prettier** - Code formatting verification
3. **TypeScript** - Type safety validation
4. **Tests** - All test suites with coverage

### Manual Quality Checks

```bash
# Fix linting issues
bun run lint:fix

# Format all files
bun run format

# Check types
bun run type-check

# Run tests
bun run test:run
```

## IDE Integration

### VS Code

Recommended extensions:

- Bun for VS Code
- ESLint
- Prettier
- TypeScript and JavaScript Language Features

### Settings

The project includes optimized settings for:

- Bun as the default runtime
- ESLint integration
- Prettier formatting on save
- TypeScript error reporting

## Testing Strategy

### Bun Test Runner

- **Native speed** - No additional transpilation needed
- **Jest compatibility** - Familiar API and matchers
- **Coverage reporting** - Built-in coverage with multiple formats
- **Property-based testing** - Ready for fast-check integration

### Test Configuration

- DOM environment setup with JSDOM
- React Testing Library integration
- Mock router for Next.js components
- Global test utilities and matchers

## Performance Optimizations

### Development

- Bun's native bundler for faster builds
- Hot module replacement optimized for React
- Intelligent file watching with ignore patterns
- Parallel test execution

### Production

- Tree shaking enabled
- Code splitting with dynamic imports
- Source maps for debugging
- Minification with size optimization

## Troubleshooting

### Common Issues

1. **Port conflicts**: Dev server automatically finds available ports
2. **Cache issues**: Use `bun run clean` to clear build artifacts
3. **Type errors**: Run `bun run type-check` for detailed diagnostics
4. **Lint errors**: Use `bun run lint:fix` for automatic fixes

### Performance Tips

1. Use `bun install` instead of `npm install` for faster dependency management
2. Leverage Bun's built-in test runner instead of Jest for better performance
3. Use the integrated bundler for custom build scripts
4. Enable Bun's cache for consistent performance across team members

## CI/CD Integration

For continuous integration, use these commands:

```bash
bun install --frozen-lockfile  # Install exact dependencies
bun run check-all:unix        # Run all checks (Linux/macOS)
bun run build                 # Build for production
```

The project is optimized for deployment on Vercel with Bun runtime support.

## Game Pricing System Documentation

The project includes a comprehensive game pricing system with detailed
documentation:

### Core Documentation

- **[PRICING_SYSTEM.md](./PRICING_SYSTEM.md)** - Technical overview of the
  pricing architecture
- **[PRICING_API_EXAMPLES.md](./PRICING_API_EXAMPLES.md)** - Developer usage
  examples and React components
- **[PRICING_MIGRATION_GUIDE.md](./PRICING_MIGRATION_GUIDE.md)** - Complete
  migration guide from old to new system
- **[DATABASE_FUNCTIONS_REFERENCE.md](./DATABASE_FUNCTIONS_REFERENCE.md)** -
  Complete reference of all database functions

### Key Features

- **Multi-store support** - Compare prices across Steam, Epic Games, PlayStation
  Store, etc.
- **Platform flexibility** - Support for PC, PlayStation, Xbox, Nintendo Switch
- **Performance optimized** - Indexed queries and efficient database functions
- **Type-safe API** - Full TypeScript integration with generated types
- **Property-based testing** - Comprehensive test coverage with correctness
  properties

### Quick Start with Pricing API

```typescript
import { supabase } from "@/lib/supabase";
import type { GamePriceResponse } from "@/lib/pricing-types";

// Get all prices for a game
const { data: prices } = await supabase.rpc("get_game_prices", {
  game_uuid: gameId,
});

// Get the best price
const { data: bestPrice } = await supabase.rpc("get_best_price", {
  game_uuid: gameId,
});

// Compare prices with statistics
const { data: comparison } = await supabase.rpc("compare_game_prices", {
  game_uuid: gameId,
});
```

## Editorial Design System (refonte)

Les pages publiques utilisent la **direction artistique éditoriale** (dark,
typo display Tomorrow, accent dynamique) introduite par la refonte
`design/editorial-refonte`. L'admin (`/admin/*`) conserve son
`DashboardLayout` glassmorphism.

### Layout

- **`EditorialShell`** (`src/components/layout/editorial/EditorialShell.tsx`) —
  wrapper de référence pour toute page publique : assemble `EditorialLayout`
  (rail 56px + sub-sidebar + mega-menu + recherche full-page). Les `page.tsx`
  publics enveloppent leur contenu dans `<EditorialShell>`.
- **`EditorialLayout`** — shell bas niveau (header sticky, rail, sub-sidebar,
  hamburger mobile). Fournit le fond sombre éditorial.

### Conventions

- **Tailwind inline** par défaut (pas de classes `.editorial-*` dans des
  modules CSS pour le simple layout/couleur). Réutilisation via composants
  React partagés (`KickerLabel`, `GameCard`…) et tokens `@theme`.
- Tokens : surfaces `bg-editorial-2` / `bg-editorial-3`, bordures
  `border-editorial-line`, texte secondaire `text-editorial-muted`, accent
  dynamique `text-editorial-accent` / `bg-editorial-accent/15`. Titres en
  `font-display` + `text-[clamp(...)]`.
- **Skeletons** sombres dès le premier paint (jamais de surface claire qui
  bascule). Override scopé `.editorial-layout-main` pour neutraliser les
  skeletons partagés (`GridSkeleton`, `EntitySkeleton`).
- **Glassmorphism retiré** des pages publiques (`backdrop-blur`, `.glass-*`
  dépréciés). Conservé uniquement pour `/admin` et legacy non migré.
- Espaces transitoires `.editorial-esport` / `.editorial-coaching`
  (`src/app/styles/editorial/*.css`) : couches de neutralisation legacy
  conservées comme filet de sécurité.

### Références

- Plan : [`docs/design/editorial-refonte-plan.md`](../design/editorial-refonte-plan.md)
- Composants : [`docs/design/editorial-components.md`](../design/editorial-components.md)
- Steering : `.kiro/steering/styles-organization.md`, `design-glassmorphism.md`

## Development Best Practices

### Code Quality

- Run `bun run check-all` before pushing changes
- Use `bun run lint:fix` to automatically fix common issues
- Format code with `bun run format` for consistency
- Ensure type safety with `bun run type-check`

### Testing

- Write tests for new features and bug fixes
- Use property-based testing for complex logic
- Maintain good test coverage (aim for >80%)
- Run tests frequently during development

### Performance

- Leverage Bun's speed for all development tasks
- Use the built-in bundler for custom scripts
- Monitor bundle size and optimize imports
- Profile performance with Bun's built-in tools
