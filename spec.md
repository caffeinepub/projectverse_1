# ProjectVerse

## Current State
Fully functional ERP SaaS frontend with 10+ modules (HR, Finance, Field, Purchasing, Inventory, CRM, Quality, Subcontractor, Reporting, Communication, Documents). All data stored in device-specific localStorage. Users identified by 16-character login codes. Companies stored in `pv_companies`, users in `pv_users`, module data in `pv_{module}_{companyId}` keys.

## Requested Changes (Diff)

### Add
- Motoko backend: User registry (loginCode → user data as JSON text)
- Motoko backend: Company registry (companyId → company data as JSON text)
- Motoko backend: User-company membership index (userId → [companyId])
- Frontend: BackendService layer (`src/services/backendService.ts`) that wraps backend actor calls
- Frontend: On login, fetch user from backend first; fall back to localStorage if backend unavailable
- Frontend: On user creation (invite), save user to backend
- Frontend: On company create/update, save to backend AND localStorage
- Frontend: On login success, fetch all user's companies from backend and merge into localStorage

### Modify
- `src/backend/main.mo`: Add user and company storage functions (keep existing invite/RSVP functions intact)
- `src/frontend/src/pages/Login.tsx`: After local auth success, trigger backend sync
- `src/frontend/src/contexts/AppContext.tsx`: createCompany writes to backend; invite code generation saves user to backend

### Remove
- Nothing removed

## Implementation Plan
1. Extend main.mo with minimal stable var Text maps for users and companies; add CRUD functions
2. Generate updated backend bindings
3. Create `backendService.ts` with async helpers (getUser, saveUser, getCompanies, saveCompany) that never throw — always fall back gracefully
4. Update Login.tsx to call backendService.syncUserFromBackend after successful local login
5. Update AppContext createCompany to also call backendService.saveCompany
6. Update CompanySettings personnel creation to call backendService.saveUser when generating invite codes
