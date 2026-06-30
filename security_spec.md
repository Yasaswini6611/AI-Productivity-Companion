# Security Specifications - AI Productivity Companion

This document establishes the security guidelines, data invariants, and threat models for the Firestore Database security configuration.

## 1. Data Invariants

1. **User Ownership**: No user can read, list, update, or delete another user's data (including profile, tasks, habits, goals, and recommendations). All paths are prefixed with `/users/{userId}/`.
2. **Path Integrity**: Path variable `{userId}` must strictly equal `request.auth.uid`.
3. **Immutability of Key Fields**: Fields such as `createdAt` and parent keys must be immutable after document creation.
4. **Valid Schema Types**: String fields must be bounded in length, and status/priorities must follow strict enumerations.
5. **Temporal Consistency**: `createdAt` and `updatedAt` must be set via `request.time`.

## 2. The "Dirty Dozen" Malicious Payloads (Pillar 1-8 Violations)

1. **Identity Spoofing on Tasks**: User A (`userA_123`) tries to create a task in User B's `/users/userB_456/tasks` path.
2. **Privilege Escalation on User Profile**: User tries to update their own role or set arbitrary permissions outside of the allowed properties.
3. **Temporal Override on Creation**: Sending a client-determined `createdAt` string like `"2020-01-01"` instead of `request.time`.
4. **Shadow Field Injection**: Creating a task with an unvalidated ghost field `isSuperAdmin: true` to bypass rule checks.
5. **Path Variable ID Poisoning**: Trying to create or access a document with a 2MB string containing junk characters as `{taskId}` to exhaust database resources.
6. **Task Status Bypassing / Action Skipping**: An unauthenticated user tries to directly transition a task status to completed without being the owner or logged in.
7. **PII Blanket Leak Request**: Attempting to list all users' private info `/users/{anyUser}/private/secure_info` without specific document access.
8. **Malicious Enum Injection**: Attempting to set `priority` to `"super-critical"` or `status` to `"deleted"`.
9. **Unbounded List Injection**: Injecting a 100,000-item array inside `subtasks` to crash client loading and run up read/write costs.
10. **Null Pointer Triggering**: Sending an update request to modify `tasks` while bypassing static validation checks.
11. **Malicious String Size Abuse**: Attempting to write a 10MB string into the `title` field of a task.
12. **Orphaned Record Insertion**: Creating a Task with an invalid or spoofed foreign key reference to a non-existent goal or project.

## 3. Test Cases Spec for Rules Verification

A simulation suite is integrated within the codebase using robust client-side routing and Firestore error handling:
- **Case 1**: Creating/reading outside own `userId` scope rejects with `PERMISSION_DENIED`.
- **Case 2**: Updating with modified `createdAt` rejects.
- **Case 3**: Exceeding character size limits on `title` rejects.
