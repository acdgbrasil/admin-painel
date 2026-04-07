---
title: "No classes — functional programming only"
scope: "file"
path: ["src/**/*.ts"]
severity_min: "critical"
languages: ["jsts"]
buckets: ["architecture"]
enabled: true
---

## Instructions

All functional: factory functions, closures, plain objects. No classes, no `this`, no `new` (except external libs like `new Elysia()`).

Flag: `class`, `this`, `new` (in app code), `extends`, prototype manipulation.

Use: plain objects with `interface`/`type`, factory functions, higher-order functions, `readonly` on all properties.
