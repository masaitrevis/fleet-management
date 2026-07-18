# Code Quality Checklist

## TypeScript
- [ ] Strict mode enabled
- [ ] No `any` types (use `unknown` instead)
- [ ] Explicit return types on public APIs
- [ ] Proper error handling with custom errors

## React
- [ ] Functional components with hooks
- [ ] Proper key props on lists
- [ ] useEffect dependencies complete
- [ ] No prop drilling (use context)

## General
- [ ] DRY principle followed
- [ ] Single responsibility per function
- [ ] Meaningful variable names
- [ ] Comments explain WHY, not WHAT
- [ ] No console.log in production
- [ ] Consistent formatting (Prettier)

## Testing
- [ ] Tests for business logic
- [ ] Tests for edge cases
- [ ] Tests for error handling
- [ ] Minimum 70% coverage
