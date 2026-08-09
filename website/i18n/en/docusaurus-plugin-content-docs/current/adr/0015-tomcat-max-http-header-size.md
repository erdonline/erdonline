# ADR-0015: Raise Tomcat `max-http-header-size` (JWT header overflow)

## Status

Accepted — 2026-08-02

## Context

Login JWT embeds full `authorities` and `role_ids` in claims. e2e/admin accounts with many permissions can reach ~8KB single `Authorization: Bearer …` header. Tomcat default `max-http-header-size=8KB`; GET may occasionally pass, POST with `Content-Type` (create/delete project, team API) rejected by connector as **HTML 400**, frontend `.json()` fails or "New project" modal confirm has no closure.

## Decision

Set Boot 3 property `server.max-http-request-header-size` (and `server.tomcat.max-http-response-header-size`) to **64KB** in `application.yml` to restore writable APIs. Do not use deprecated `server.tomcat.max-http-header-size`.

## Consequences

- Positive: create/delete/team APIs no longer HTML 400 from header overflow
- Negative: JWT not shrunk; continued permission growth may still approach limit
- Follow-up (not this slice): JWT carries roleIds only, permissions loaded from Redis/DB (separate ADR)

## Verification

When `Authorization` header >8KB, `POST /ncnb/project/add` returns JSON `code=200` (or business error), not `text/html` 400.
