# ProjectVerse

## Current State
v46: Comprehensive construction ERP with 30+ modules all functional. All module data persistent via Motoko backend. Amber/gold theme, Turkish default, RBAC, multi-tenant.

Modules: Dashboard, Projects, HR, Finance (with Hakediş), Purchasing, Inventory, Field Ops, Documents, Communication, Reporting, Quality & Safety, CRM, Subcontractors, Equipment, Quotes, ISG, SiteLog, Drawings, Meetings, PunchList, ResourceCalendar, RiskRegister, Contracts, MaterialRequests, ClientReport.

## Requested Changes (Diff)

### Add
1. **Nakit Akış Projeksiyonu** - New tab in Finance: monthly cash flow projection table and chart (planned income vs. expense by month)
2. **Şantiye Fotoğraf Galerisi** - New page `SitePhotos`: project-based photo gallery, filterable by date/tag/location, uses blob-storage
3. **İmar & Yapı Ruhsatı Takibi** - New page `Permits`: permit type, issuing authority, validity date, renewal alerts
4. **Tedarikçi Fiyat Kataloğu** - New tab in Purchasing: supplier-based material price catalog, usable in quote preparation
5. **Personel Öz Servis Portalı** - New page `SelfService`: employees can view their own leave requests, payroll history, certificates
6. **Proje Kapanış Raporu** - New tab/section in Projects or Reporting: auto-generated closure report for completed projects (budget vs actual, duration deviation, quality findings)

### Modify
- App.tsx: Add new page types and route to new pages
- Layout.tsx: Add new pages to sidebar navigation
- Finance.tsx: Add Nakit Akış tab
- Purchasing.tsx: Add Tedarikçi Fiyat Kataloğu tab

### Remove
Nothing removed.

## Implementation Plan
1. Create SitePhotos.tsx page (photo gallery with upload, project filter, tag/date filter)
2. Create Permits.tsx page (permit CRUD, validity tracking, renewal alerts)
3. Create SelfService.tsx page (personal leave, payroll, certifications view)
4. Add Nakit Akış tab to Finance.tsx
5. Add Tedarikçi Fiyat Kataloğu tab to Purchasing.tsx
6. Add Proje Kapanış Raporu tab to Reporting.tsx
7. Update App.tsx with new page routes
8. Update Layout.tsx sidebar with new navigation items
