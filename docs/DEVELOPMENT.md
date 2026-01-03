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
