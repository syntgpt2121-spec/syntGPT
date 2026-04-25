# 🔧 Netlify Environment Variables - Manuel Kurulum

## Sorun: E-posta servisi ayarları eksik

Site deploy oldu ama API'lar çalışmıyor çünkü environment variables eksik.

## Çözüm: Manuel Olarak Ekle

### 1. Netlify Dashboard'a Git
- https://app.netlify.com/
- Sitenizi seçin (courageous-mochi-f8e298)

### 2. Environment Variables Bölümüne Git
- Site Settings → Environment variables
- "Add a variable" butonuna tıkla

### 3. Bu Değişkenleri Tek Tek Ekle:

```
Variable name: GROQ_API_KEY
Value: <YOUR_GROQ_API_KEY>
Scopes: All scopes
```

```
Variable name: SMTP_HOST
Value: smtp.gmail.com
Scopes: All scopes
```

```
Variable name: SMTP_PORT
Value: 587
Scopes: All scopes
```

```
Variable name: SMTP_USER
Value: <YOUR_SMTP_USER>
Scopes: All scopes
```

```
Variable name: SMTP_PASS
Value: <YOUR_SMTP_PASS>
Scopes: All scopes
```

```
Variable name: APP_NAME
Value: SyntGPT
Scopes: All scopes
```

```
Variable name: FROM_EMAIL
Value: <YOUR_FROM_EMAIL>
Scopes: All scopes
```

```
Variable name: RESEND_API_KEY
Value: dummy_key_for_fallback
Scopes: All scopes
```

### 4. Deploy'u Tetikle
Environment variables ekledikten sonra:
- Site Overview → Deploys
- "Trigger deploy" → "Deploy site"

### 5. Test Et
Deploy tamamlandıktan sonra:
- Site URL'ine git
- Chat fonksiyonunu test et
- API endpoint'leri kontrol et

## Hızlı Kopyala-Yapıştır

**GROQ_API_KEY:**
```
<YOUR_GROQ_API_KEY>
```

**SMTP_USER:**
```
<YOUR_SMTP_USER>
```

**SMTP_PASS:**
```
<YOUR_SMTP_PASS>
```

---

**Bu adımları takip ettikten sonra site tamamen çalışır durumda olacak!**