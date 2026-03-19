# ProjectVerse

## Current State
v43 kapsamlı inşaat/saha ERP SaaS platformu. Mevcut modüller: Dashboard, Projeler (Kanban/Gantt/Milestone), Saha Operasyonları, İletişim, Belgeler, İK (izin/mesai/vardiya/sertifika/bordro), Finans (bütçe/fatura/onay), Satın Alma, Envanter, Araç & Ekipman, Taşeron Yönetimi, CRM, Teklif & Keşif, Kalite & Güvenlik, Şantiye Logu, Çizim & Planlar, Toplantı Tutanakları, Punch List, Kaynak Takvimi, Risk Kaydı, Raporlama. Tüm veriler backend-synced (v42+). 16 karakterli kod bazlı kimlik doğrulama.

## Requested Changes (Diff)

### Add
1. **Hakediş Yönetimi** (Finans altında yeni sekme): iş kalemi bazlı hakediş cetveli, % tamamlanma, onay zinciri, kesinti/stopaj hesabı
2. **İSG Modülü** (yeni sayfa): kaza/ramak kala bildirimleri, KKD takibi, toolbox talk kayıtları, olay soruşturma formu
3. **Tedarikçi Performans Değerlendirmesi** (Satın Alma altında yeni sekme): puan sistemi, teslimat/kalite skoru, sipariş geçmişi analizi
4. **Özelleştirilebilir Dashboard**: kullanıcı widget seçimi, rol bazlı varsayılan düzen, widget sürükleme/kaldırma
5. **Vardiya & Puantaj** (İK altında yeni sekme): giriş/çıkış saati bazlı puantaj, ay sonu puantaj cetveli, onay akışı
6. **Bildirim & Uyarı Merkezi** (header'dan erişilebilir panel): sertifika son kullanma, geciken görev, onay bekleyen kayıtlar için otomatik uyarılar

### Modify
- AppContext: hakediş, ISG, tedarikçi değerlendirme, puantaj, bildirimler için state eklenir
- App.tsx: `isg` ve yeni sayfa key'leri eklenir
- Layout.tsx: İSG sidebar'a eklenir (OPERASYONLAR grubuna), Quotes sidebar'a eklenir
- Finance.tsx: Hakediş sekmesi eklenir
- Purchasing.tsx: Tedarikçi Performans sekmesi eklenir
- HumanResources.tsx: Puantaj sekmesi eklenir
- Dashboard.tsx: widget seçimi ve özelleştirme eklenir
- Layout.tsx header: bildirim zili genişletilir

### Remove
- Hiçbir mevcut özellik kaldırılmıyor

## Implementation Plan
**Tur 1:**
1. AppContext'e hakediş, ISG, tedarikçi değerlendirme, puantaj state'leri ekle
2. ISG sayfası oluştur (ISG.tsx)
3. Finance.tsx'e Hakediş sekmesi ekle
4. Purchasing.tsx'e Tedarikçi Performans sekmesi ekle
5. HumanResources.tsx'e Puantaj sekmesi ekle
6. App.tsx ve Layout.tsx güncelle

**Tur 2:**
7. Dashboard'a özelleştirilebilir widget sistemi ekle
8. Layout header'a Bildirim & Uyarı Merkezi paneli ekle (sertifika/görev/fatura uyarıları otomatik üret)
