# ProjectVerse

## Current State
Sürüm 48 itibarıyla uygulama kapsamlı bir inşaat sektörü ERP'si olarak çalışmaktadır. Tüm temel modüller (İK, Finans, Satın Alma, Envanter, Saha, CRM, Kalite, Taşeron, Ekipman, İSG, Sözleşme, vb.) eksiksiz ve backend-senkronize durumdadır.

## Requested Changes (Diff)

### Add
- **İşe Alım & Onboarding Modülü (İK altında yeni sekme):** İş ilanı oluşturma, aday başvuru takibi, mülakat aşamaları (Ön Görüşme → Teknik → Teklif → İşe Alındı/Reddedildi), onboarding kontrol listesi
- **Avans & Harcama Yönetimi (Finans altında yeni sekme):** Personel avans talebi, saha masraf bildirimi (fotoğraflı), onay akışı, ödeme durumu, Finans gider entegrasyonu
- **Müşteri Şikayet & Talep Yönetimi (CRM altında yeni sekme):** Şikayet/talep kaydı, öncelik seviyesi, sorumlu atama, durum takibi (Açık/İşlemde/Çözüldü/Kapatıldı), çözüm süresi takibi
- **Depo Lokasyon & Raf Yönetimi (Envanter altında yeni sekme):** Depo/bölge/raf tanımı, stok kaleme lokasyon atama, lokasyon bazlı stok raporu, lokasyon transferi
- **Taşeron İş Emri Yönetimi (Taşeron Yönetimi altında yeni sekme):** Taşeron firmalara iş emri atama, iş tanımı, başlangıç/bitiş, teslim belgesi, hakediş entegrasyonu

### Modify
- HumanResources.tsx: Yeni "İşe Alım" sekmesi eklenir
- Finance.tsx: Yeni "Avans & Harcama" sekmesi eklenir
- CRM.tsx: Yeni "Şikayetler & Talepler" sekmesi eklenir
- Inventory.tsx: Yeni "Depo Lokasyonları" sekmesi eklenir
- SubcontractorManagement.tsx: Yeni "İş Emirleri" sekmesi eklenir

### Remove
- Hiçbir mevcut özellik kaldırılmıyor

## Implementation Plan
1. HumanResources.tsx dosyasına İşe Alım sekmesi ekle (iş ilanı, aday pipeline, onboarding checklist)
2. Finance.tsx dosyasına Avans & Harcama sekmesi ekle (talep formu, onay akışı, gider entegrasyonu)
3. CRM.tsx dosyasına Şikayetler sekmesi ekle (kayıt, sorumlu atama, durum takibi)
4. Inventory.tsx dosyasına Depo Lokasyonları sekmesi ekle (lokasyon tanımı, stok atama, transfer)
5. SubcontractorManagement.tsx dosyasına Taşeron İş Emirleri sekmesi ekle
