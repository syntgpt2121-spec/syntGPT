# Netlify Deployment Setup Guide

## Environment Variables Configuration

Bu proje Netlify'de çalışması için aşağıdaki environment variables'ların tanımlanması gerekiyor:

### Gerekli Environment Variables

| Variable | Açıklama | Örnek Değer |
|----------|----------|-------------|
| `GROQ_API_KEY` | Groq AI API anahtarı | `gsk_...` |
| `SMTP_USER` | Gmail SMTP kullanıcı adı | `syntgptt@gmail.com` |
| `SMTP_PASS` | Gmail App Password | `abcd efgh ijkl mnop` |
| `SMTP_HOST` | SMTP sunucu adresi | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port numarası | `587` |
| `RESEND_API_KEY` | Resend.com API anahtarı (opsiyonel) | `re_...` |
| `APP_NAME` | Uygulama adı | `SyntGPT` |
| `FROM_EMAIL` | Gönderen e-posta adresi | `syntgptt@gmail.com` |

### Manuel Kurulum (Netlify Dashboard)

1. Netlify Dashboard'a giriş yapın
2. Sitenizi seçin
3. **Site settings** > **Environment variables** bölümüne gidin
4. **Add a variable** butonuna tıklayın
5. Yukarıdaki tablodan her bir variable'ı ekleyin

### Otomatik Kurulum (PowerShell Script)

Proje klasöründe bulunan `setup-netlify-env.ps1` script'ini kullanabilirsiniz:

```powershell
# PowerShell'i yönetici olarak çalıştırın
.\setup-netlify-env.ps1
```

Script sizden gerekli bilgileri isteyecek ve otomatik olarak Netlify'e yükleyecektir.

### Gmail App Password Alma

SMTP_PASS için normal Gmail şifrenizi KULLANMAYIN. App Password almanız gerekiyor:

1. Google Hesabınıza gidin
2. **Güvenlik** sekmesine tıklayın
3. **2 Adımlı Doğrulama**'yı aktif edin (gerekirse)
4. **Uygulama şifreleri** bölümüne gidin
5. **Uygulama seçin** > **Diğer** > "SyntGPT" yazın
6. **Oluştur** butonuna tıklayın
7. Çıkan 16 karakterlik şifreyi kopyalayın
8. Bu şifreyi `SMTP_PASS` olarak kullanın

### Groq API Key Alma

1. [Groq Console](https://console.groq.com/) adresine gidin
2. Hesap oluşturun veya giriş yapın
3. **API Keys** bölümüne gidin
4. **Create API Key** butonuna tıklayın
5. Anahtarı kopyalayın ve `GROQ_API_KEY` olarak kullanın

### Deploy Sonrası Kontrol

Environment variables'ları ayarladıktan sonra:

1. Siteyi yeniden deploy edin: `netlify deploy --prod`
2. Veya Git push yaparak otomatik deploy'u bekleyin
3. Site URL'ine giderek çalışıp çalışmadığını kontrol edin
4. API endpoint'lerini test edin:
   - `/api/health` - Sağlık kontrolü
   - `/api/groq/chat` - Chat API
   - `/api/send-verification-code` - E-posta gönderimi

### Sorun Giderme

**"Site not available" hatası:**
- Environment variables'ların doğru tanımlandığından emin olun
- Netlify build log'larını kontrol edin
- Functions'ların doğru deploy edildiğini kontrol edin

**API endpoint'leri çalışmıyor:**
- `GROQ_API_KEY` tanımlı mı kontrol edin
- `SMTP_USER` ve `SMTP_PASS` doğru mu kontrol edin
- Netlify Functions log'larını inceleyin

**E-posta gönderilmiyor:**
- Gmail App Password'ü doğru aldığınızdan emin olun
- `SMTP_USER` ve `SMTP_PASS` değerlerini kontrol edin
- Alternatif olarak `RESEND_API_KEY` kullanabilirsiniz