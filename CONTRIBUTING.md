# Contributing to @nlweb-ai/search-components

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/nlweb-ai/search-components.git
cd search-components
```

2. Install dependencies using pnpm:
```bash
pnpm install
```

3. Start development:
```bash
pnpm run dev
```

## Development Workflow

### Making Changes

1. Create a new branch for your feature or bugfix:
```bash
git checkout -b feature/my-new-feature
```

2. Make your changes following the coding standards below

3. Run tests and checks:
```bash
# Type checking
pnpm run typecheck

# Linting
pnpm run lint

# Format code
pnpm run format

# Build
pnpm run build
```

4. Commit your changes with a clear commit message

5. Push to your branch and create a pull request

## Coding Standards

### TypeScript

- Use TypeScript for all components
- Export all component props interfaces
- Use strict type checking
- Avoid using `any` types

### React

- Use functional components with hooks
- Follow React best practices
- Keep components focused and reusable

### Styling

- Use Tailwind CSS utility classes
- Allow className prop for customization
- Follow responsive design principles
- Maintain consistent spacing and sizing

### Code Style

- Follow the existing code style
- Use Prettier for formatting (automatically enforced)
- Use ESLint rules (automatically checked)
- Write clear, self-documenting code
- Add comments for complex logic

## Pull Request Process

1. Ensure your code passes all checks (typecheck, lint, build)
2. Update the README.md if you're adding new components or features
3. Add examples for new components
4. Request review from maintainers
5. Address any feedback
6. Once approved, your PR will be merged

## Adding New Components

When adding a new component:

1. Create the component file in `src/components/`
2. Export the component from `src/index.ts`
3. Add TypeScript interfaces for all props
4. Use Tailwind CSS for styling
5. Make the component customizable via props
6. Add documentation to README.md
7. Include usage examples

## Component Guidelines

### Props Design

- Required props should be minimal
- Provide sensible defaults
- Allow customization via className
- Support common event handlers (onClick, onChange, etc.)
- Use clear, descriptive prop names

### Accessibility

- Ensure components are keyboard accessible
- Use semantic HTML elements
- Add ARIA attributes where appropriate
- Support screen readers

### Performance

- Avoid unnecessary re-renders
- Use React.memo for expensive components
- Keep bundle size small
- Use tree-shaking friendly exports

## Questions?

If you have questions or need help, please:
- Open an issue for bugs or feature requests
- Start a discussion for general questions
- Reach out to the maintainers

Thank you for contributing!
