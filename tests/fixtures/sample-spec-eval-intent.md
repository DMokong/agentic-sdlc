---
id: SPEC-TEST
status: approved
risk_level: low
---

## Problem Statement
Users need a way to log in with their email address instead of a username.

## Requirements
- [ ] R1: Accept email address as login identifier
- [ ] R2: Validate email format before attempting authentication

## Acceptance Criteria
- [ ] AC1: Given a valid email and correct password, when the user submits the login form, then they are authenticated and redirected to the dashboard
- [ ] AC2: Given an invalid email format, when the user submits the login form, then an error message appears below the email field without submitting the form

## Intent & Anti-Patterns

### Anti-Patterns
- **Database-detail evals**: Writing evals that verify SQL query structure rather than authentication outcome
- **Timing-coupled evals**: Evals that rely on specific response times rather than the user experience

### Critical User Journeys
- **Login success**: user enters credentials → submits → lands on dashboard
- **Validation feedback**: user enters bad email → form stays open → sees error
