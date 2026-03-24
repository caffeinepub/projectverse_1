# ProjectVerse v57

## Current State
Sürüm 56 yayında. Tüm temel ERP modülleri mevcut. Sidebar'da 3 sayfa (bankAccounts, shipments, siteAccess) herhangi bir nav grubuna dahil edilmemiş -- tanımlı ama görünmüyor.

## Requested Changes (Diff)

### Add
- **Banka Mutabakatı** -- BankAccounts sayfasına yeni sekme: banka ekstre girişi, sistem kayıtlarıyla eşleştirme, fark raporu
- **Ekipman Kiralama Takibi** -- Equipment sayfasına yeni sekme: kiralık ekipman kayıtları, kira süresi/bedeli, kiralama firması, ödeme takvimi
- **Personel Eğitim Matrisi** -- HumanResources sayfasına yeni sekme: bölüm/pozisyon bazlı eğitim ihtiyaç matrisi, tamamlanma yüzdesi
- **Çevre & Atık Yönetimi** -- Yeni sayfa: atık türü, bertaraf yöntemi, çevresel izin takibi, aylık atık miktarı raporu
- **Vardiya Planlama (Shift Scheduling)** -- FieldOps sayfasına yeni sekme: haftalık vardiya planı oluşturma, personel atama, vardiya çakışması uyarısı
- **Proje Maliyet Analizi (Detaylı)** -- Reporting'e yeni sekme: WBS/maliyet kodu bazlı detaylı maliyet dağılımı, bütçe vs. gerçekleşen tablo

### Modify
- **Layout.tsx sidebar**: bankAccounts, shipments ve siteAccess sayfalarını ilgili nav gruplarına ekle (OPERASYONLAR veya PROJE KONTROLÜ altına)

### Remove
- Hiçbir şey kaldırılmıyor

## Implementation Plan
1. Layout.tsx'te bankAccounts → OPERASYONLAR grubuna, shipments → PROJE KONTROLÜ grubuna, siteAccess → PROJE KONTROLÜ grubuna ekle
2. BankAccounts.tsx'e Mutabakat sekmesi ekle
3. Equipment.tsx'e Kiralama sekmesi ekle
4. HumanResources.tsx'e Eğitim Matrisi sekmesi ekle
5. Yeni EnvironmentalManagement.tsx sayfası oluştur, App.tsx'e route ekle, Layout.tsx'te PROJE KONTROLÜ altına ekle
6. FieldOps.tsx'e Vardiya Planlama sekmesi ekle
7. Reporting.tsx'e maliyetDetay sekmesi ekle
