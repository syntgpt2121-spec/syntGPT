# Netlify Deploy Rehberi - pct86623@gmail.com

## Adım 1: Netlify CLI Kurulumu ve Giriş

```bash
# Netlify CLI'yi global olarak yükle
npm install -g netlify-cli

# Yeni hesaba giriş yap
netlify logout  # Eski hesaptan çıkış
netlify login   # pct86623@gmail.com ile giriş yap
```

## Adım 2: Yeni Site Oluşturma

```bash
# Proje klasöründe yeni site oluştur
netlify init

# Veya manuel site oluşturma
netlify sites:create --name syntgpt-app
```

## Adım 3: Environment Variables Ayarlama

Aşağıdaki komutları çalıştırın (site ID'sini yukarıdaki adımdan alacaksınız):

```bash
# GROQ API Key
netlify env:set GROQ_API_KEY "<YOUR_GROQ_API_KEY>" --scope functions

# SMTP Ayarları
netlify env:set SMTP_HOST "smtp.gmail.com" --scope functions
netlify env:set SMTP_PORT "587" --scope functions
netlify env:set SMTP_USER "<YOUR_SMTP_USER>" --scope functions
netlify env:set SMTP_PASS "<YOUR_SMTP_PASS>" --scope functions

# App Ayarları
netlify env:set APP_NAME "SyntGPT" --scope functions
netlify env:set FROM_EMAIL "<YOUR_FROM_EMAIL>" --scope functions
```

## Adım 4: Deploy

```bash
# İlk deploy (preview)
netlify deploy

# Production deploy
netlify deploy --prod
```

## Adım 5: Site URL'ini Al

Deploy tamamlandıktan sonra Netlify size site URL'ini verecek.

---

**Şimdi bu adımları takip edelim. İlk olarak Netlify CLI kurulu mu kontrol edelim?**