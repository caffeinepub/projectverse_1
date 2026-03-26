# ProjectVerse

## Current State
v70 - Full construction ERP with all major modules. SubcontractorManagement has 6 tabs: Taşeronlar, Sözleşmeler, Ödemeler, Denetim Logu, Öz Servis, İş Emirleri.

## Requested Changes (Diff)

### Add
- İSG Uyum (HSE Compliance) tab in SubcontractorManagement
  - Per-employee HSE records per subcontractor
  - KKD delivery tracking, HSE training status, certificate validity
  - Auto-calculated compliance score (0-100)
  - KPI summary cards
  - Filter by subcontractor

### Modify
- SubcontractorManagement.tsx: added 7th tab

### Remove
- Nothing removed

## Implementation Plan
- Add İSG Uyum tab with SubHSERecord data model to SubcontractorManagement
- Store in pv_sub_hse_{companyId} localStorage key
