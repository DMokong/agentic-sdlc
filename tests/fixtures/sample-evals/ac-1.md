# Eval: AC1 — Successful login with email

**Observable success (without source code access)**:
A user who enters their email address and correct password into the login form should be taken to the dashboard page. They should not see an error message. The transition should happen within the same browser session.

**Anti-patterns this eval would catch**:
- System accepts username but not email (would fail — email is the input)
- System shows database error to user instead of redirecting (would fail — error is not a dashboard)

**Would fail if**:
- Login with a valid email shows an error message
- User reaches dashboard but sees content from a different account
- Login with email silently fails (no redirect, no error)
