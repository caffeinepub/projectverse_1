# ProjectVerse

## Current State

Full ERP frontend with 10+ modules. Authentication uses 16-character login codes stored in localStorage. Company creation and user management are fully localStorage-based. Backend has invite-links and RBAC components but no user/company persistence. All module data (projects, tasks, HR, finance, etc.) is in company-scoped localStorage.

## Requested Changes (Diff)

### Add
- Backend: User entity with id (Principal), name, loginCode (16-char), accountType, companyIds
- Backend: Company entity with id, name, sector, ownerId, memberIds with roles
- Backend: registerUser(name, loginCode, accountType) -> userId
- Backend: loginWithCode(loginCode) -> optional User
- Backend: createCompany(name, sector) -> companyId  
- Backend: addMemberToCompany(companyId, userId, role) -> bool
- Backend: getUserCompanies(userId) -> [Company]
- Backend: getCompany(companyId) -> optional Company
- Backend: generateInviteCode(companyId) -> 8-char code
- Backend: joinWithInviteCode(inviteCode, userId) -> bool

### Modify
- AppContext: login/register functions call backend first, fall back to localStorage for offline
- AppContext: on startup, try to sync user/company data from backend
- Login.tsx: wire registration and login to backend calls

### Remove
- Nothing removed; all module data remains in localStorage for now

## Implementation Plan

1. Generate Motoko backend with user + company management
2. Update AppContext to call backend for auth operations with localStorage fallback
3. Update Login.tsx to handle async backend calls with loading states
