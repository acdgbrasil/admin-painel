---
title: "All dynamic values in HTML must use esc() helper"
scope: "file"
path: ["src/presenter/view/**/*.ts"]
severity_min: "critical"
languages: ["jsts"]
buckets: ["security"]
enabled: true
---

## Instructions

This app renders HTML from template literals. ALL user-supplied or API-sourced dynamic values must be escaped via the `esc()` helper to prevent XSS.

Flag:
- Template literal HTML with `${variable}` that doesn't pass through `esc()`
- `innerHTML` assignments with unescaped content
- Missing import of `esc` from helpers

Allowed:
- `${esc(value)}` — properly escaped
- Static HTML strings with no dynamic values
- Nested component calls that return already-escaped HTML
- Boolean/number values used for attributes (not content)

## Examples

### Bad example
```typescript
const greeting = (name: string) => `<h1>Hello, ${name}</h1>`;
// XSS: name could be "<script>alert('xss')</script>"
```

### Good example
```typescript
import { esc } from '../helpers';
const greeting = (name: string) => `<h1>Hello, ${esc(name)}</h1>`;
```
