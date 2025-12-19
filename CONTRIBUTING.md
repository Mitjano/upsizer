# Contributing to Pixelift

Thank you for your interest in contributing to Pixelift! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database
- Redis instance
- Git

### Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/pixelift.git
cd pixelift
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env.local
```

4. Configure environment variables in `.env.local`

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start development server:
```bash
npm run dev
```

## Development Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/dark-mode`)
- `fix/` - Bug fixes (e.g., `fix/login-error`)
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates

### Commit Messages

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance tasks

Examples:
```
feat(upscaler): add 16x upscaling option
fix(auth): resolve session timeout issue
docs(readme): update installation instructions
```

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` type - use proper typing
- Use interfaces for object shapes

```typescript
// Good
interface User {
  id: string;
  email: string;
  credits: number;
}

// Avoid
const user: any = { ... };
```

### React Components

- Use functional components with hooks
- Use `"use client"` directive for client components
- Keep components focused and small
- Use proper prop typing

```typescript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export default function Button({ onClick, children, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
```

### Styling

- Use Tailwind CSS classes
- Follow mobile-first approach
- Use dark mode variants (`dark:`)
- Group related classes logically

```tsx
<div className="
  flex items-center gap-4 p-4
  bg-white dark:bg-gray-800
  rounded-lg shadow-md
  hover:shadow-lg transition-shadow
">
```

### API Routes

- Use proper HTTP methods
- Return appropriate status codes
- Include error messages
- Validate input data

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // ... process request

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test:run

# Run in watch mode
npm run test

# Run specific file
npm run test:run -- __tests__/api/upscale.test.ts

# Run with coverage
npm run test:run -- --coverage
```

### Writing Tests

- Place tests in `__tests__/` directory
- Mirror source file structure
- Use descriptive test names
- Test edge cases

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid email', async () => {
      const user = await createUser({ email: 'test@example.com' });
      expect(user.email).toBe('test@example.com');
    });

    it('should reject invalid email', async () => {
      await expect(createUser({ email: 'invalid' }))
        .rejects.toThrow('Invalid email');
    });
  });
});
```

## Pull Request Process

1. **Create feature branch** from `main`

2. **Make changes** following code standards

3. **Run checks**:
```bash
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript
npm run test:run      # Tests
npm run build         # Build
```

4. **Commit changes** with proper message

5. **Push branch** to your fork

6. **Open Pull Request** with:
   - Clear title and description
   - Link to related issue (if any)
   - Screenshots for UI changes
   - Test instructions

7. **Address review feedback**

8. **Merge** after approval

## Adding New AI Tool

When adding a new AI tool:

1. **Create API endpoint**: `app/api/[tool-name]/route.ts`

2. **Create component**: `components/[ToolName].tsx`

3. **Create page**: `app/[locale]/tools/[tool-name]/page.tsx`

4. **Update Header**: Add to navigation in `components/Header.tsx`

5. **Add translations**: Update all locale files in `messages/`

6. **Configure credits**: Add to `lib/credits-config.ts`

7. **Write tests**: Add API and component tests

8. **Update docs**: Document the new tool

## i18n Guidelines

- Add translations for all 4 languages (en, pl, es, fr)
- Use nested keys for organization
- Avoid hardcoded strings in components

```json
// messages/en/common.json
{
  "tools": {
    "newTool": {
      "name": "New Tool",
      "description": "Tool description"
    }
  }
}
```

```tsx
// Component
const t = useTranslations('common');
<h1>{t('tools.newTool.name')}</h1>
```

## Security Guidelines

- Never commit secrets or API keys
- Validate all user input
- Use parameterized queries (Prisma)
- Implement rate limiting
- Check OWASP Top 10

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
