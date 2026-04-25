# 🚀 SyntGPT Manuel Netlify Deploy Rehberi

## Adım 1: Netlify'a Giriş Yap
1. https://app.netlify.com/ adresine git
2. pct86623@gmail.com hesabıyla giriş yap

## Adım 2: Yeni Site Oluştur
1. "Add new site" butonuna tıkla
2. "Deploy manually" seçeneğini seç

## Adım 3: Build Klasörünü Sürükle
1. Bu klasörü aç: `C:\Users\atthe\OneDrive\Masaüstü\asıl\client\dist`
2. Tüm içeriği seç (Ctrl+A)
3. Netlify'ın "Drag and drop" alanına sürükle

## Adım 4: Environment Variables Ekle
Site oluşturulduktan sonra:
1. Site Settings > Environment variables
2. Şu değişkenleri ekle:

```
GROQ_API_KEY = <YOUR_GROQ_API_KEY>
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = <YOUR_SMTP_USER>
SMTP_PASS = <YOUR_SMTP_PASS>
APP_NAME = SyntGPT
FROM_EMAIL = <YOUR_FROM_EMAIL>
```

## Adım 5: Functions Ekle
1. Site Settings > Functions
2. Functions directory: `netlify/functions`
3. `netlify/functions/api.js` dosyasını upload et

## Adım 6: Redirects Ayarla
1. Site Settings > Redirects and rewrites
2. Şu kuralları ekle:
   - `/api/*` → `/.netlify/functions/api/:splat` (200)
   - `/*` → `/index.html` (200)

## Beklenen Sonuç
Site URL'i: https://[site-name].netlify.app
API endpoints çalışacak ve React uygulaması yüklenecek.

---

**NOT**: Bu adımları takip ettikten sonra site çalışır durumda olacak!