# ProjectVerse v68 - Malzeme Onay Talebi (Material Submittal)

## Current State
ProjectVerse has MaterialRequests page for internal purchase requests and RFI tracking. There is no formal Material Submittal (Malzeme Onay Talebi) flow where materials must be approved by engineer/employer before use on site.

## Requested Changes (Diff)

### Add
- New page: `MaterialSubmittals.tsx` -- Material Submittal management
  - List view: submittal no, malzeme adı, tedarikçi, gönderim tarihi, durum (Beklemede/İncelemede/Onaylandı/Reddedildi/Revizyon Gerekli)
  - New submittal form: malzeme adı, spesifikasyon, tedarikçi, miktar, birim, proje, bölüm/imalat kalemi, açıklama, belge ekleme (PDF/foto)
  - Onay akışı: her submittal için inceleyici atama, onay/ret/revizyon talebi yapabilme
  - Revizyon geçmişi: her revizyonda yeni versiyon oluşturulur, önceki versiyonlar görüntülenebilir
  - Durum badge'leri: renk kodlu (sarı=beklemede, mavi=incelemede, yeşil=onaylı, kırmızı=reddedildi, turuncu=revizyon)
  - Filtreler: proje, durum, tarih aralığı
- Route `materialSubmittals` added to App.tsx
- Nav item added to Layout.tsx under PROJE KONTROLÜ section (after materialRequests)

### Modify
- `App.tsx`: import and route MaterialSubmittals
- `Layout.tsx`: add materialSubmittals nav item to PROJE KONTROLÜ section

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/pages/MaterialSubmittals.tsx` with full CRUD, status workflow, and revision history
2. Add route in App.tsx
3. Add nav item in Layout.tsx under PROJE KONTROLÜ
4. Use localStorage with company-scoped key for data persistence
5. Use amber/gold theme consistent with rest of app
