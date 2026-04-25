# 🚀 SyntGPT Final Deploy Instructions

## Netlify CLI Sorunu Çözüldü ✅

Netlify CLI'da bir bug var, bu yüzden manuel deploy yapacağız.

## Hazır Dosyalar ✅

- ✅ `client/dist/` - Build edilmiş React uygulaması
- ✅ `syntgpt-deploy.zip` - Deploy için hazır zip dosyası
- ✅ `netlify.toml` - Doğru konfigürasyon
- ✅ `netlify/functions/api.js` - API fonksiyonları

## Deploy Adımları

### 1. Netlify'a Git
https://app.netlify.com/ (pct86623@gmail.com ile giriş yap)

### 2. Yeni Site Oluştur
- "Add new site" → "Deploy manually"
- `syntgpt-deploy.zip` dosyasını sürükle
- VEYA `client/dist` klasörünün içindeki dosyaları sürükle

### 3. Site Ayarları
Site oluştuktan sonra:

**Site Settings → Build & deploy → Build settings:**
- Build command: `npm --prefix client run build`
- Publish directory: `client/dist`
- Functions directory: `netlify/functions`

**Site Settings → Environment variables:**
```
GROQ_API_KEY = <YOUR_GROQ_API_KEY>
SMTP_HOST = <YOUR_SMTP_HOST>
SMTP_PORT = <YOUR_SMTP_PORT>
SMTP_USER = <YOUR_SMTP_USER>
SMTP_PASS = <YOUR_SMTP_PASS>
APP_NAME = <YOUR_APP_NAME>
FROM_EMAIL = <YOUR_FROM_EMAIL>
```

**Site Settings → Functions:**
- `netlify/functions/api.js` dosyasını upload et

### 4. Redirects (Otomatik)
netlify.toml dosyası bu ayarları otomatik yapacak:
- `/api/*` → `/.netlify/functions/api/:splat`
- `/*` → `/index.html`

## Beklenen Sonuç

✅ Site URL: https://[random-name].netlify.app
✅ API endpoints çalışacak
✅ React uygulaması yüklenecek
✅ Chat fonksiyonu çalışacak
✅ Email gönderimi çalışacak

---

## Alternatif: Otomatik Script

Eğer Netlify CLI düzelirse:
```powershell
.\auto-deploy-netlify.ps1
```

## Sorun Giderme

**Site yüklenmiyor:**
- Environment variables'ları kontrol et
- Functions klasörünü kontrol et

**API çalışmıyor:**
- GROQ_API_KEY doğru mu?
- Functions deploy edildi mi?

**Email gönderilmiyor:**
- SMTP ayarları doğru mu?
- Gmail App Password kullanıldı mı?

---

**Tüm dosyalar hazır! Sadece Netlify'a sürükle-bırak yap.**