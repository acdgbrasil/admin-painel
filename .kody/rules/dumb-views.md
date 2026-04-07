---
title: "Views must be dumb — no logic, no imports from Model"
scope: "file"
path: ["src/presenter/view/**/*.ts"]
severity_min: "high"
languages: ["jsts"]
buckets: ["architecture"]
enabled: true
---

## Instructions

Views receive typed state and return HTML strings. They are completely dumb.

Flag:
- Importing from `data/model/`, `data/repository/`, `data/service/`, `application/`
- Fetch calls or async operations
- Business logic (conditionals based on business rules, data transformation)
- Direct DOM manipulation (views return HTML strings, not DOM nodes)

Allowed:
- Importing from `view/helpers.ts` (the `esc()` function)
- Importing other view components (atoms, molecules, organisms)
- Simple display conditionals (show/hide based on state boolean)
- Template literal HTML construction

## Examples

### Bad example
```typescript
// View importing model and doing logic
import { UserState } from '../../data/model/user';

const userRow = (user: User) => {
  const isActive = user.lastLogin > Date.now() - 86400000; // Business logic!
  return `<tr><td>${user.name}</td><td>${isActive ? 'Active' : 'Inactive'}</td></tr>`;
};
```

### Good example
```typescript
import { esc } from '../helpers';

interface UserRowState {
  readonly name: string;
  readonly statusBadge: string;
}

const userRow = (state: UserRowState) =>
  `<tr><td>${esc(state.name)}</td><td>${state.statusBadge}</td></tr>`;
```
