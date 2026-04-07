---
title: "No hardcoded secrets or OIDC credentials"
scope: "pull_request"
severity_min: "critical"
buckets: ["security"]
enabled: true
---

## Instructions

Scan PR diff for hardcoded secrets. This admin panel manages user accounts and talks to Zitadel.

Flag: OIDC_CLIENT_SECRET, SESSION_SECRET, API keys, tokens, database passwords, `.env` committed.

Allowed: `Bun.env.KEY` references, `.env.example` with placeholders, test fixtures with fake values.
