# ProjectVerse

## Current State
ProjectVerse is a modular ERP-SaaS platform with 10+ modules, all using company-scoped localStorage. The codebase has 31 code-level bugs identified by static analysis, spanning broken RBAC, hardcoded values, broken cross-module integrations, and multi-tenant isolation failures.

## Requested Changes (Diff)

### Add
- 6 missing modules (purchasing, inventory, communication, reporting, qualitySafety, crm) to `ALL_MODULE_PERMISSIONS` and `getDefaultPermissionsByRole` in AppContext
- `annualLeaveBalance` field to `Personnel` type (default 14, but editable per employee)
- `updateOrder` function in AppContext that persists all order fields (not just status)
- Invoice creation dialog in Finance module
- CRM contact edit and delete capability in contact detail modal
- Corrective action input field in QualitySafety inspection close flow
- Incident close action text input (instead of hardcoded string)

### Modify
- AppContext: Make projects/tasks/workOrders/fieldInspections company-scoped (`pv_projects_${cid}` etc.)
- AppContext: `setActiveCompany` must also reload projects, tasks, workOrders, fieldInspections, taskComments
- AppContext: Fix `updateOrderStatus` to only update status (keep); add separate `updateOrder(id, Partial<Order>)` for full edits
- Fix role permission checks in Finance, Purchasing, HumanResources, Inventory, Reporting — replace broken `"manager_idari"` string comparisons with `activeRoleId === "owner" || activeRoleId === "manager"` or use `checkPermission()`
- Purchasing: Store project by ID not title; fix project lookup to use ID throughout
- Purchasing: `handleSaveOrder` must call new `updateOrder` to persist deliveryDate and notes
- Inventory: Match stock items to projects by ID not title
- Reporting: Remove fabricated budget fallback (`expenses * 1.3` / `100000`); use real project.budget or show N/A
- Reporting: Replace raw `localStorage.getItem` for CRM/QS with reactive state via `useEffect` + `useState`
- Reporting: Wire invoices data into invoice KPI card
- Communication: On `activeCompanyId` change, reset `activeChannelId` to first channel of new company
- Communication: Persist unread counts per channel to AppContext `channel.unread` field, not just local state
- HumanResources: Add `useEffect` to reload `personnelDocs` when `activeCompanyId` changes
- HumanResources: Use `personnel.annualLeaveBalance` instead of hardcoded 14
- FieldOps: Remove shadow inventory deduction from `actualCost` blur handler (keep only the explicit dialog on complete)
- Finance: Wire "Fatura Yükle" button to open an invoice creation dialog that calls `setInvoices`

### Remove
- Hardcoded fallback strings `"Ben"`, `"Mevcut Kullanıcı"`, `"Satın Alma Modülü"` — replace with `user?.name || ""` (no Turkish fallback)
- `void invoices` suppression in Reporting.tsx

## Implementation Plan
1. Update AppContext: add missing modules to permission maps, company-scope project/task/workOrder/inspection keys, add `updateOrder`, reload taskComments in setActiveCompany
2. Fix all 5 modules with broken role ID comparisons (Finance, Purchasing, HR, Inventory, Reporting)
3. Fix Purchasing: project stored/looked up by ID
4. Fix Inventory: stock items matched to projects by ID
5. Fix Reporting: remove fabricated budgets, use reactive CRM/QS state, wire invoices
6. Fix Communication: reset activeChannelId on company switch, sync unread counts
7. Fix HumanResources: reload personnelDocs on company switch, use per-employee leave balance
8. Fix FieldOps: remove duplicate shadow inventory deduction
9. Finance: implement invoice creation dialog
10. QualitySafety: add corrective action input for inspections, action text input for incident close
11. CRM: add edit and delete to contact detail modal
