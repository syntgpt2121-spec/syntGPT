# Netlify Deploy Hatası Düzeltme Gereksinimleri

## Giriş

Netlify deploy işlemi "Site not available" hatası veriyor ve kullanım limitine ulaştığı belirtiliyor. Kullanıcı yeni hesap açmasına rağmen site hala çalışmıyor. Proje yapısında iki farklı netlify.toml dosyası (root ve client klasöründe) çakışma yaratıyor ve environment variables eksik.

## Bug Analizi

### Mevcut Davranış (Hata)

1.1 İKİ farklı netlify.toml dosyası mevcut olduğunda sistem çakışma yaratıyor ve yanlış build konfigürasyonu kullanıyor

1.2 Environment variables (GROQ_API_KEY, SMTP_USER, SMTP_PASS, RESEND_API_KEY) eksik olduğunda API fonksiyonları çalışmıyor

1.3 Yeni Netlify hesabı açıldığında eski hesabın environment variables'ları otomatik transfer edilmiyor

1.4 Root seviyesindeki netlify.toml client klasöründeki netlify.toml ile çakıştığında build path karışıklığı oluşuyor

### Beklenen Davranış (Doğru)

2.1 TEK bir netlify.toml dosyası olduğunda sistem doğru build konfigürasyonunu kullanmalı

2.2 Tüm gerekli environment variables tanımlandığında API fonksiyonları düzgün çalışmalı

2.3 Yeni Netlify hesabında environment variables manuel olarak tanımlandığında site çalışmalı

2.4 Build path ve publish directory açık şekilde tanımlandığında deploy işlemi başarılı olmalı

### Değişmeyecek Davranış (Regresyon Önleme)

3.1 API endpoints (/api/groq/chat, /api/groq/smart-ai, /api/send-verification-code) mevcut olduğunda çalışmaya devam etmeli

3.2 React client uygulaması build edildiğinde dist klasörüne çıktı vermeye devam etmeli

3.3 Serverless functions netlify/functions klasöründe tanımlandığında çalışmaya devam etmeli

3.4 SPA routing (/*) redirect'i çalıştığında React Router düzgün çalışmaya devam etmeli