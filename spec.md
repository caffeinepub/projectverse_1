# ProjectVerse

## Current State
- All major ERP modules implemented and functional (HR, Finance, Communication, Documents, Field, Purchasing, Inventory, Reporting, Quality & Safety, CRM, Subcontractor Management)
- RBAC covers all modules
- Data persists in company-scoped localStorage
- Audit logs exist in Finance and HR only
- SubcontractorManagement: no audit log, no payment approval flow, no Finance integration, contracts use free-text project name
- Inventory, CRM, QualitySafety: no audit log tabs

## Requested Changes (Diff)

### Add
- SubcontractorManagement: payment approval flow (Bekliyor payments get Onayla/Reddet buttons), Finance integration (approved payment creates expense record), contract project linked to AppContext projects, audit log tab
- Inventory: audit log tab tracking stock additions, movements, and edits
- CRM: audit log tab tracking contact/lead changes
- QualitySafety: audit log tab tracking inspection and incident changes
- General UI polish: improved card visuals, empty state consistency

### Modify
- SubcontractorManagement: SubContract.projectId (string ID) instead of projectName; populate project dropdown from AppContext; approved payment triggers Finance expense record

### Remove
- Nothing removed

## Implementation Plan
1. Add audit log infrastructure (shared AuditEntry type and helper) to each module
2. Update SubcontractorManagement: payment approval buttons, Finance expense on payment approval, project ID linkage, audit log tab
3. Add audit log tab to Inventory
4. Add audit log tab to CRM
5. Add audit log tab to QualitySafety
6. UI polish pass: consistent empty states, card hover states, sidebar visual depth
