# ProjectVerse

## Current State
v63 canlı. Harita, İş Akışı Otomasyonu ve Müşteri Portalı en son eklendi. Uygulama 68+ sayfa ile tam kapsamlı bir inşaat ERP'si. Tüm veriler backend'de kalıcı.

## Requested Changes (Diff)

### Add
- PWA desteği: manifest.json, uygulama yüklenebilir olsun (Add to Home Screen), uygulama ikonu, tema rengi
- Bildirdiğimiz hatırlatıcılar için temel Service Worker (offline sayfası cache)
- Gelişmiş Global Arama: tüm modüllerde arama sonuçlarını kategorize eden, tıklanınca ilgili sayfaya yönlendiren gelişmiş arama paneli

### Modify
- Mevcut arama kutusunu (varsa) daha kapsamlı hale getir

### Remove
- Hiçbir şey kaldırılmıyor

## Implementation Plan
1. manifest.json ekle (PWA metadata, icons, theme_color: amber)
2. index.html'e manifest ve meta tag'leri ekle
3. Basit service worker (sw.js) -- offline fallback
4. Mevcut GlobalSearch bileşenini geliştir: proje, personel, fatura, iş emri, tedarikçi, ekipman kategorilerinde sonuç göster, tıklanınca ilgili sayfaya git
