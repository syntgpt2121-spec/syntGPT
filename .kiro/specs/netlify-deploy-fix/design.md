# Netlify Deploy Hatası Düzeltme Tasarımı

## Genel Bakış

Netlify deploy işleminde "Site not available" hatası ve kullanım limiti sorunları yaşanıyor. Ana problemler: çakışan netlify.toml dosyaları, eksik environment variables ve yanlış build konfigürasyonu. Bu düzeltme, tek bir merkezi netlify.toml dosyası kullanarak build sürecini standardize edecek ve gerekli environment variables'ları tanımlayacak.

## Sözlük

- **Bug_Condition (C)**: Çakışan netlify.toml dosyaları ve eksik environment variables nedeniyle deploy işleminin başarısız olması
- **Property (P)**: Deploy işleminin başarılı olması ve sitenin erişilebilir durumda olması
- **Preservation**: Mevcut API endpoints, React routing ve serverless functions'ların çalışmaya devam etmesi
- **netlify.toml**: Netlify build ve deploy konfigürasyon dosyası
- **Environment Variables**: API anahtarları ve SMTP ayarları gibi gizli konfigürasyon değerleri
- **Serverless Functions**: netlify/functions klasöründeki API endpoint'leri

## Bug Detayları

### Bug Koşulu

Bug, iki farklı netlify.toml dosyasının mevcut olduğu ve environment variables'ların eksik olduğu durumlarda ortaya çıkıyor. Netlify build sistemi hangi konfigürasyonu kullanacağını bilemediği için yanlış build path'i seçiyor.

**Formal Spesifikasyon:**
```
FUNCTION isBugCondition(deployConfig)
  INPUT: deployConfig of type NetlifyDeployConfiguration
  OUTPUT: boolean
  
  RETURN (deployConfig.rootNetlifyToml EXISTS AND deployConfig.clientNetlifyToml EXISTS)
         OR (deployConfig.environmentVariables.GROQ_API_KEY IS_MISSING)
         OR (deployConfig.environmentVariables.SMTP_USER IS_MISSING)
         OR (deployConfig.environmentVariables.SMTP_PASS IS_MISSING)
         OR (deployConfig.environmentVariables.RESEND_API_KEY IS_MISSING)
END FUNCTION
```

### Örnekler

- **Çakışan Konfigürasyon**: Root seviyesinde `netlify.toml` (publish: "client/dist") ve client klasöründe `netlify.toml` (publish: "dist") mevcut → Build path karışıklığı
- **Eksik API Anahtarı**: GROQ_API_KEY tanımlı değil → `/api/groq/chat` endpoint'i "API key not configured" hatası veriyor
- **Eksik SMTP Ayarları**: SMTP_USER ve SMTP_PASS tanımlı değil → `/api/send-verification-code` endpoint'i çalışmıyor
- **Edge Case**: Yeni Netlify hesabında environment variables otomatik transfer edilmiyor → Manuel tanımlama gerekiyor

## Beklenen Davranış

### Korunacak Gereksinimler

**Değişmeyecek Davranışlar:**
- API endpoints (/api/groq/chat, /api/groq/smart-ai, /api/send-verification-code, /api/health) çalışmaya devam etmeli
- React client uygulaması Vite ile build edilip dist klasörüne çıktı vermeye devam etmeli
- Serverless functions netlify/functions/api.js dosyasından serve edilmeye devam etmeli
- SPA routing (/*) redirect'i React Router ile çalışmaya devam etmeli

**Kapsam:**
Deploy konfigürasyonu değişikliği SADECE build ve environment setup'ını etkilemeli. Uygulama kodu, API logic'i ve frontend routing'i tamamen değişmeden kalmalı.

## Varsayılan Kök Neden

Bug açıklamasına dayanarak, en olası sorunlar:

1. **Çakışan Netlify Konfigürasyonları**: İki farklı netlify.toml dosyası mevcut
   - Root seviyesinde: `command = "npm --prefix client run build"`, `publish = "client/dist"`
   - Client klasöründe: `command = "npm run build"`, `publish = "dist"`
   - Netlify hangi konfigürasyonu kullanacağını bilemediği için yanlış path seçiyor

2. **Eksik Environment Variables**: Yeni Netlify hesabında API anahtarları tanımlı değil
   - GROQ_API_KEY: Groq AI API'si için gerekli
   - SMTP_USER, SMTP_PASS: E-posta gönderimi için gerekli
   - RESEND_API_KEY: Alternatif e-posta servisi için gerekli

3. **Build Path Karışıklığı**: Functions path'i yanlış tanımlanmış olabilir
   - Root netlify.toml: `functions = "netlify/functions"`
   - Client netlify.toml: functions tanımı yok

4. **Deploy Context Sorunları**: Production ve preview environment'ları arasında fark olabilir

## Doğruluk Özellikleri

Property 1: Bug Condition - Netlify Deploy Başarısı

_Herhangi bir_ deploy konfigürasyonunda bug koşulu geçerli olduğunda (isBugCondition true döndürdüğünde), düzeltilmiş konfigürasyon başarılı bir şekilde build edilmeli, deploy edilmeli ve site erişilebilir durumda olmalı.

**Doğrular: Gereksinimler 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Mevcut Fonksiyonalite Korunması

_Herhangi bir_ API isteği veya frontend routing işlemi için, düzeltilmiş deploy konfigürasyonu orijinal konfigürasyonla aynı sonucu üretmeli ve mevcut API endpoints, React routing ve serverless functions'ları korumalı.

**Doğrular: Gereksinimler 3.1, 3.2, 3.3, 3.4**

## Düzeltme Implementasyonu

### Gerekli Değişiklikler

Kök neden analizimizin doğru olduğunu varsayarak:

**Dosya**: `netlify.toml` (root seviyesi)

**Değişiklik**: Mevcut konfigürasyonu optimize et

**Spesifik Değişiklikler**:
1. **Client netlify.toml Silme**: `client/netlify.toml` dosyasını sil (çakışmayı önlemek için)

2. **Root netlify.toml Optimizasyonu**: Mevcut konfigürasyonu doğrula ve gerekirse düzelt
   - Build command: `npm --prefix client run build` (doğru)
   - Publish directory: `client/dist` (doğru)
   - Functions directory: `netlify/functions` (doğru)

3. **Environment Variables Tanımlama**: Netlify dashboard'da şu değişkenleri tanımla
   - `GROQ_API_KEY`: Groq AI API anahtarı
   - `SMTP_USER`: Gmail SMTP kullanıcı adı
   - `SMTP_PASS`: Gmail SMTP şifresi (App Password)
   - `RESEND_API_KEY`: Resend.com API anahtarı (opsiyonel)
   - `SMTP_HOST`: smtp.gmail.com (varsayılan)
   - `SMTP_PORT`: 587 (varsayılan)

4. **Build Environment Optimizasyonu**: Node.js versiyonunu 20 olarak sabit tut

5. **Redirect Kuralları Doğrulama**: API ve SPA routing redirect'lerini kontrol et

## Test Stratejisi

### Doğrulama Yaklaşımı

Test stratejisi iki aşamalı bir yaklaşım izler: önce düzeltme öncesi bug'ı göster, sonra düzeltmenin doğru çalıştığını ve mevcut davranışı koruduğunu doğrula.

### Keşifsel Bug Koşulu Kontrolü

**Hedef**: Düzeltme implementasyonu ÖNCESINDE bug'ı gösteren karşı örnekleri ortaya çıkar. Kök neden analizini doğrula veya çürüt. Eğer çürütürsek, yeniden hipotez kurmamız gerekecek.

**Test Planı**: Mevcut konfigürasyonla deploy işlemi gerçekleştir ve hataları gözlemle. Environment variables eksikliğini ve konfigürasyon çakışmasını test et.

**Test Durumları**:
1. **Çakışan Konfigürasyon Testi**: İki netlify.toml dosyası mevcut iken deploy et (düzeltme öncesi kodda başarısız olacak)
2. **Eksik Environment Variables Testi**: API anahtarları olmadan API endpoint'lerini test et (düzeltme öncesi kodda başarısız olacak)
3. **Build Path Testi**: Yanlış publish directory ile deploy et (düzeltme öncesi kodda başarısız olacak)
4. **Functions Path Testi**: Serverless functions'ların erişilebilirliğini test et (düzeltme öncesi kodda başarısız olabilir)

**Beklenen Karşı Örnekler**:
- Deploy işlemi "Site not available" hatası veriyor
- API endpoints 500 hatası veriyor (environment variables eksik)
- Olası nedenler: konfigürasyon çakışması, eksik API anahtarları, yanlış build path

### Düzeltme Kontrolü

**Hedef**: Bug koşulunun geçerli olduğu tüm girişler için, düzeltilmiş konfigürasyonun beklenen davranışı ürettiğini doğrula.

**Pseudocode:**
```
FOR ALL deployConfig WHERE isBugCondition(deployConfig) DO
  result := netlifyDeploy_fixed(deployConfig)
  ASSERT expectedBehavior(result)
END FOR
```

### Koruma Kontrolü

**Hedef**: Bug koşulunun geçerli OLMADIĞI tüm girişler için, düzeltilmiş konfigürasyonun orijinal konfigürasyonla aynı sonucu ürettiğini doğrula.

**Pseudocode:**
```
FOR ALL apiRequest WHERE NOT isBugCondition(deployConfig) DO
  ASSERT originalAPI(apiRequest) = fixedAPI(apiRequest)
END FOR
```

**Test Yaklaşımı**: Koruma kontrolü için property-based testing önerilir çünkü:
- Giriş alanı boyunca otomatik olarak birçok test durumu üretir
- Manuel unit testlerin kaçırabileceği edge case'leri yakalar
- Buggy olmayan girişler için davranışın değişmediğine dair güçlü garantiler sağlar

**Test Planı**: Önce DÜZELTME ÖNCESİ kodda API endpoints ve frontend routing davranışını gözlemle, sonra bu davranışı yakalayan property-based testler yaz.

**Test Durumları**:
1. **API Endpoints Korunması**: Tüm API endpoints'lerinin (/api/groq/chat, /api/groq/smart-ai, /api/send-verification-code, /api/health) çalışmaya devam ettiğini doğrula
2. **React Routing Korunması**: SPA routing'inin (/*) düzgün çalıştığını doğrula
3. **Build Output Korunması**: Client uygulamasının dist klasörüne doğru şekilde build edildiğini doğrula
4. **Serverless Functions Korunması**: netlify/functions/api.js'nin düzgün serve edildiğini doğrula

### Unit Testler

- Deploy konfigürasyonu doğrulaması için testler
- Environment variables varlığı kontrolü
- Build command ve publish directory doğrulaması
- API endpoints'lerinin response kontrolü

### Property-Based Testler

- Rastgele API istekleri oluştur ve endpoint'lerin düzgün çalıştığını doğrula
- Rastgele frontend route'ları test et ve React Router'ın düzgün çalıştığını doğrula
- Çeşitli deploy konfigürasyonları test et ve build sürecinin tutarlı olduğunu doğrula

### Entegrasyon Testleri

- Tam deploy sürecini test et (build + deploy + site erişilebilirliği)
- API endpoints'lerinin production environment'da çalışmasını test et
- Frontend ve backend entegrasyonunu test et
- Environment variables'ların production'da doğru yüklendiğini test et