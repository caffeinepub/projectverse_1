# ProjectVerse -- Phase 6

## Current State
- Phase 5 delivered: İnsan Kaynakları (HR) and İletişim (Communication) modules.
- Finance and Documents modules are in the nav but marked `available: false` (placeholder only).
- App.tsx routes: dashboard, projects, fieldOps, hr, communication are active.
- HR module has personnel cards, leave management (request/approval), weekly shift planner.
- Communication module has project channels + general channel, text messaging, file attachment button.
- FieldOps module has job orders and inspections.

## Requested Changes (Diff)

### Add
- **Finance Module** (`src/frontend/src/pages/Finance.tsx`)
  - Dashboard summary: total budget, spent, remaining, pending approvals
  - Project-based budget tracking table (planned vs actual)
  - Expense records list with create form (amount, category, project, description, receipt upload)
  - Expense approval workflow (pending / approved / rejected statuses)
  - Invoice list (vendor, amount, due date, status: paid / pending / overdue)
  - Role-based access: only Owner and Manager (financial-authorized roles) can approve/edit

- **Documents Module** (`src/frontend/src/pages/Documents.tsx`)
  - Folder structure: Company-wide folders + per-project folders
  - File list per folder (name, type icon, size, uploader, upload date)
  - Upload button (simulated, blob-storage compatible)
  - File actions: download, delete (role-based)
  - Search/filter files by name or type
  - Role-based access: all roles can view, only authorized roles can upload/delete

### Modify
- **App.tsx**: import and render Finance and Documents pages
- **Layout.tsx**: set `available: true` for finance and documents nav items
- **HumanResources.tsx**:
  - Add "Documents" tab to personnel card detail view (list of personal docs: contract, ID, certifications)
  - Add leave calendar view (monthly calendar showing approved leaves by person)
- **Communication.tsx**:
  - Add message search bar within a channel
  - Add read receipt indicators ("Okundu" / tick marks)
- **FieldOps.tsx**:
  - Add cost field to job order detail (estimated cost, actual cost)
  - Link to Finance module ("Gider Oluştur" button on job order detail)

### Remove
- Nothing removed

## Implementation Plan
1. Create `Finance.tsx` with mock data: budget summary cards, project budget table, expense list with approval flow, invoice list. Tabs: Bütçe / Giderler / Faturalar.
2. Create `Documents.tsx` with mock folder tree (sidebar), file list (main area), upload button, search. Folders: Genel, and per-project folders.
3. Update `App.tsx`: import Finance, Documents; add render conditions `page === 'finance'` and `page === 'documents'`.
4. Update `Layout.tsx`: set `available: true` for finance and documents.
5. Update `HumanResources.tsx`: add Documents tab to personnel detail panel; add calendar view tab to leave management.
6. Update `Communication.tsx`: add search input at top of message area; add read receipt "✓✓" to sent messages.
7. Update `FieldOps.tsx`: add cost fields (estimated/actual) to job order detail; add "Gider Oluştur" button.
