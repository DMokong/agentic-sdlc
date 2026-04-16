# Eval: AC2 — Email format validation feedback

**Observable success (without source code access)**:
A user who types "notanemail" into the email field and clicks submit should see an error message near the email field, and the form should remain on screen (not submit). The error should describe what's wrong with the input — not a generic "something went wrong."

**Anti-patterns this eval would catch**:
- Validation runs server-side only (database-detail anti-pattern — form submits then shows error)
- Error says "Internal server error" instead of describing the validation issue

**Would fail if**:
- Form submits despite invalid email format
- Error message appears but doesn't describe the format problem
- Error appears but is not associated with the email field
