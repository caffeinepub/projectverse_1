# ProjectVerse – v53

## Current State
ProjectVerse is a comprehensive multi-tenant construction ERP SaaS (v52) with all major modules implemented: HR, Finance, Purchasing, Inventory, Field, Documents, CRM, Quality & Safety, Subcontractor Management, Equipment, OHS, Reporting, and many specialized modules. All data is backend-synced and multi-device. UI uses amber/gold theme with Turkish default language.

## Requested Changes (Diff)

### Add

1. **Proje Hub (Proje Özet Sayfası)** – Per-project overview page accessible from project list. Shows consolidated KPIs from all modules: budget status, schedule deviation, open risks count, punch list summary, last meeting date, latest hakediş status, open NCRs, active personnel count. Acts as the daily morning check page for project managers.

2. **Tatil Takvimi (Company Holiday Calendar)** – Under Company Settings or HR module. Admin can define official company holidays (national holidays + company-specific). Leave requests automatically exclude defined holiday days from leave balance deduction. Calendar view showing holidays and leave overlaps.

3. **Metraj / BoQ Kütüphanesi (Bill of Quantities)** – Company-level work item library. Items have code, description, unit, unit price. Projects can import items from library to create project-specific BoQ. BoQ items link to cost codes and hakediş line items.

4. **Şirket Özel Alanları (Custom Fields)** – Under Company Settings. Admin can define custom fields (text, number, date, dropdown) for: Projects, Personnel, Equipment. Custom fields appear in respective forms and lists.

5. **Eskalasyon Kuralları (Escalation Rules)** – Under Onay Akışları or Bildirim Merkezi. Rules: define trigger (approval pending X days), action (notify specific role/user). Applied to finance approvals, purchasing approvals, leave requests. Shows active escalations in notification center.

6. **Proje Karşılaştırmalı Analiz / Benchmark** – New tab in Raporlama module. Side-by-side comparison of multiple projects: budget variance %, schedule variance %, quality score, open risk count, NCR count, personnel count. Bar/radar charts for visual comparison.

### Modify
- Project list/detail: add "Hub" button or make project card clickable to open Proje Hub
- HR leave request form: integrate holiday calendar to auto-exclude holidays from day count
- Onay Akışları page: add escalation rules section
- Raporlama: add Benchmark tab

### Remove
- Nothing removed

## Implementation Plan
1. **Batch 1:** Proje Hub page component, Tatil Takvimi (HR or Settings), BoQ Kütüphanesi page
2. **Batch 2:** Custom Fields settings UI, Eskalasyon Kuralları section, Benchmark tab in Raporlama
3. Wire all new data to AppContext with company-scoped localStorage persistence
4. Add sidebar navigation entries for new top-level pages
