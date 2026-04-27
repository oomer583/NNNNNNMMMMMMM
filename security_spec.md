# Security Specification: LinkBoard

## 1. Data Invariants
- A **User** profile must correspond exactly to the authenticated user's UID and email.
- A **Project** must always belong to a valid user (`userId`).
- Only the owner of a project can read, update, or delete it.
- Projects must have a non-empty name (max 100 chars).
- Timestamps must be validated against `request.time`.

## 2. The "Dirty Dozen" Payloads (Red Team Attack Vectors)

### Collection: projects
1. **Identity Spoofing**: Create a project with someone else's `userId`.
2. **Missing Integrity**: Create a project without a `name`.
3. **Payload Bloat**: Create a project with a 200 character name.
4. **State Poisoning**: Update a project's `userId` to transfer ownership.
5. **ID Poisoning**: Create a project with a 2KB junk string as the document ID.
6. **Relational Orphan**: Create a project without being signed in.
7. **Cross-User Leak**: Try to `list` someone else's projects.
8. **PII Scraping**: Try to `get` someone else's user profile (containing email).
9. **Timestamp Fraud**: Send a custom past date in `updatedAt` during creation.
10. **Shadow Key Injection**: Create a project with a hidden `isAdmin: true` field.
11. **Type Mismatch**: Send an array instead of a string for `name`.
12. **Unauthorized Metadata Update**: Change the `userId` field of an existing project.

## 3. Test Runner (Draft Logic)

```ts
// Example tests that MUST fail (Permission Denied)
test('should deny creating project for different user', () => {
  assertFails(createProject({ userId: 'other-user', name: 'Leaked' }));
});

test('should deny reading person profile of others', () => {
  assertFails(getDoc('users/other-user'));
});
```
