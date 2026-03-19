# ProjectVerse

## Current State
ProjectVerse is a comprehensive multi-tenant ERP SaaS platform for construction/field operations. v42 includes: Projects, Tasks, Field Ops (work orders, inspections), HR (leave, overtime, payroll, certifications), Finance, Purchasing, Inventory, Communication, Documents, Quality & Safety, CRM, Subcontractor Management, Equipment Management, Quotes/Discovery, Reporting, Global Search, Audit Logs, RBAC, multi-language. User/company/project/task records are backend-synced; other data uses localStorage.

## Requested Changes (Diff)

### Add
1. **Günlük Şantiye Logu** (`/siteLog`) - Daily site log per project: date, weather, personnel count, work summary, issues encountered, photos notes, weather status (sunny/cloudy/rainy/snowy/windy). List view with filter by project and date.
2. **Çizim & Plan Yönetimi** (`/drawings`) - Technical drawing management with revision tracking: drawing number, title, discipline (architectural/structural/mechanical/electrical/plumbing), revision number, status (active/superseded/draft/for_review), upload date, uploaded by, notes. Can add new revision to existing drawing.
3. **Toplantı Tutanakları** (`/meetings`) - Meeting minutes: meeting title, date, location, attendees (multi-select from personnel), agenda, decisions made, action items (task, responsible person, due date, status). Print/export view.
4. **Punch List / Kusur Takibi** (`/punchList`) - Defect and snagging list: item description, location, discipline, priority (critical/high/medium/low), responsible party, due date, status (open/in_progress/completed/closed), photo notes.
5. **Kaynak Takvimi** (`/resourceCalendar`) - Visual weekly/monthly resource calendar: shows which personnel and equipment are assigned to which project on which dates. Matrix view (rows=resources, cols=dates). Can add assignment: resource, project, start date, end date.
6. **Risk Kaydı** (`/riskRegister`) - Risk register: risk title, category (technical/financial/schedule/safety/environmental/subcontractor), probability (1-5), impact (1-5), risk score (auto-calculated), owner, mitigation plan, status (open/mitigated/closed/accepted), review date.

### Modify
- `Layout.tsx`: Add 6 new nav items in appropriate groups. Add new nav group "PROJE KONTROLü" with: siteLog, drawings, meetings, punchList. Add resourceCalendar to OPERASYONLAR group. Add riskRegister to ANALİTİK group.
- `App.tsx`: Add imports and routing for 6 new pages.

### Remove
Nothing removed.

## Implementation Plan
1. Create `SiteLog.tsx` - daily site log CRUD with project filter, date filter, weather icons
2. Create `Drawings.tsx` - drawing register with revision management, discipline badges, status tracking
3. Create `Meetings.tsx` - meeting minutes with attendees, agenda, decisions, action items table
4. Create `PunchList.tsx` - punch list with priority colors, status tracking, KPI summary
5. Create `ResourceCalendar.tsx` - grid calendar with person/equipment rows, project-colored cells
6. Create `RiskRegister.tsx` - risk matrix table, probability×impact score, color-coded risk levels
7. Update `Layout.tsx` - new nav group, 6 new nav items with icons
8. Update `App.tsx` - imports, AppPage type additions, routing handlers, page renders
