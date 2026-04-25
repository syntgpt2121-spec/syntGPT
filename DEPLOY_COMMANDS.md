# 🚀 SyntGPT Netlify Deploy - Kopyala Yapıştır Komutları

## Adım 1: PowerShell'i Yönetici Olarak Aç

Windows tuşu + X → "Windows PowerShell (Yönetici)"

## Adım 2: Proje Klasörüne Git

```powershell
cd "C:\Users\atthe\OneDrive\Masaüstü\asıl"
```

## Adım 3: Execution Policy Ayarla

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Adım 4: Otomatik Deploy Script'ini Çalıştır

```powershell
.\auto-deploy-netlify.ps1
```

## Script Ne Yapacak:

1. ✅ Netlify CLI'yi kontrol eder/yükler
2. ✅ Browser açar → pct86623@gmail.com ile giriş yapın
3. ✅ Yeni site oluşturur (syntgpt-app-TARIH)
4. ✅ Environment variables'ları ayarlar:
   - GROQ_API_KEY
   - SMTP ayarları (syntgptt@gmail.com)
   - App ayarları
5. ✅ Preview deploy yapar
6. ✅ Production deploy yapar
7. ✅ Site URL'ini verir

## Beklenen Sonuç:

```
🎉 Deploy tamamlandı!
📋 Site Bilgileri:
  🌐 Site URL: https://syntgpt-app-20241220-123456.netlify.app
  🆔 Site ID: abc123...
  👤 Hesap: pct86623@gmail.com

✅ SyntGPT artık çalışıyor!
```

---

**Sadece yukarıdaki komutları sırayla kopyala-yapıştır yapın!**

Sorun yaşarsanız hata mesajını paylaşın, düzeltirim.