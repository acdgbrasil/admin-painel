---
title: "Use ApiResult<T> discriminated union, not thrown errors"
scope: "file"
path: ["src/application/**/*.ts", "src/data/**/*.ts"]
severity_min: "high"
languages: ["jsts"]
buckets: ["error-handling"]
enabled: true
---

## Instructions

Error handling uses `ApiResult<T>` discriminated union. Thrown errors are reserved for truly exceptional/unrecoverable situations.

Flag:
- `throw new Error(...)` for expected business errors (not found, validation, permission)
- try/catch blocks wrapping business logic that should use ApiResult
- Functions returning `Promise<T>` that should return `Promise<ApiResult<T>>`

Allowed:
- Throwing for programmer errors (assertion failures)
- Catching external library errors and converting to ApiResult

## Examples

### Bad example
```typescript
const findUser = async (id: string): Promise<User> => {
  const user = await repo.findById(id);
  if (!user) throw new Error('User not found'); // Don't throw for expected case
  return user;
};
```

### Good example
```typescript
const findUser = async (id: string): Promise<ApiResult<User>> => {
  const user = await repo.findById(id);
  if (!user) return { success: false, error: { code: 'USR-001', message: 'User not found' } };
  return { success: true, data: user };
};
```
