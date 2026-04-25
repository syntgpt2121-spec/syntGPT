# SyntGPT Otomatik Netlify Deploy Script'i
# Bu script tüm deploy sürecini otomatikleştirir

param(
    [Parameter(Mandatory=$false)]
    [string]$SiteName = "syntgpt-app-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "🚀 SyntGPT Otomatik Netlify Deploy"
Write-Output "================================`n"

# Netlify CLI kontrolü ve kurulumu
Write-Output "📦 Netlify CLI kontrol ediliyor..."
try {
    $netlifyVersion = netlify --version 2>$null
    Write-ColorOutput Green "✅ Netlify CLI kurulu: $netlifyVersion"
} catch {
    Write-ColorOutput Yellow "⚠️  Netlify CLI bulunamadı. Yükleniyor..."
    npm install -g netlify-cli
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Netlify CLI yüklenemedi."
        Write-Output "Manuel olarak yükleyin: npm install -g netlify-cli"
        exit 1
    }
    Write-ColorOutput Green "✅ Netlify CLI yüklendi"
}

# Mevcut oturumu kontrol et
Write-Output "`n🔐 Netlify oturum durumu kontrol ediliyor..."
$currentUser = netlify status --json 2>$null | ConvertFrom-Json -ErrorAction SilentlyContinue

if ($currentUser -and $currentUser.account -and $currentUser.account.email -eq "pct86623@gmail.com") {
    Write-ColorOutput Green "✅ Doğru hesapla giriş yapılmış: pct86623@gmail.com"
} else {
    Write-ColorOutput Yellow "⚠️  Hesap değiştirme gerekiyor..."
    Write-Output "Lütfen aşağıdaki adımları takip edin:"
    Write-Output "1. Açılacak browser'da pct86623@gmail.com ile giriş yapın"
    Write-Output "2. Netlify'e erişim izni verin"
    Write-Output "3. Bu pencereye geri dönün"
    
    netlify logout 2>$null
    netlify login
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Giriş başarısız. Lütfen manuel olarak giriş yapın."
        exit 1
    }
}

# Yeni site oluştur
Write-Output "`n🌐 Yeni Netlify sitesi oluşturuluyor..."
Write-Output "Site adı: $SiteName"

$siteResult = netlify sites:create --name $SiteName --json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Site oluşturulamadı: $siteResult"
    Write-Output "Farklı bir site adı deneyin veya mevcut siteyi kullanın."
    exit 1
}

$siteInfo = $siteResult | ConvertFrom-Json
$siteId = $siteInfo.id
$siteUrl = $siteInfo.url

Write-ColorOutput Green "✅ Site oluşturuldu!"
Write-Output "  Site ID: $siteId"
Write-Output "  Site URL: $siteUrl"

# Environment variables'ları ayarla
Write-Output "`n📝 Environment variables ayarlanıyor..."

$envVars = @{
    "GROQ_API_KEY" = "<YOUR_GROQ_API_KEY>"
    "SMTP_HOST" = "smtp.gmail.com"
    "SMTP_PORT" = "587"
    "SMTP_USER" = "<YOUR_SMTP_USER>"
    "SMTP_PASS" = "<YOUR_SMTP_PASS>"
    "APP_NAME" = "SyntGPT"
    "FROM_EMAIL" = "<YOUR_FROM_EMAIL>"
}

foreach ($env in $envVars.GetEnumerator()) {
    Write-Output "  → $($env.Key) ayarlanıyor..."
    $result = netlify env:set $($env.Key) "$($env.Value)" --scope functions --site $siteId 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "   ❌ Hata: $result"
    } else {
        Write-ColorOutput Green "   ✅ $($env.Key) ayarlandı"
    }
}

# İlk deploy (preview)
Write-Output "`n🚀 İlk deploy başlatılıyor (preview)..."
$deployResult = netlify deploy --site $siteId --json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Preview deploy başarısız: $deployResult"
    exit 1
}

$deployInfo = $deployResult | ConvertFrom-Json
$previewUrl = $deployInfo.deploy_url

Write-ColorOutput Green "✅ Preview deploy başarılı!"
Write-Output "  Preview URL: $previewUrl"

# Production deploy
Write-Output "`n🎯 Production deploy başlatılıyor..."
$prodResult = netlify deploy --prod --site $siteId --json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ Production deploy başarısız: $prodResult"
    exit 1
}

$prodInfo = $prodResult | ConvertFrom-Json
$prodUrl = $prodInfo.url

Write-ColorOutput Green "🎉 Deploy tamamlandı!"
Write-Output ""
Write-ColorOutput Cyan "📋 Site Bilgileri:"
Write-Output "  🌐 Site URL: $prodUrl"
Write-Output "  🆔 Site ID: $siteId"
Write-Output "  👤 Hesap: pct86623@gmail.com"
Write-Output ""
Write-ColorOutput Green "✅ SyntGPT artık çalışıyor!"
Write-Output "  Siteyi test etmek için: $prodUrl"

# Site URL'ini clipboard'a kopyala (Windows)
try {
    $prodUrl | Set-Clipboard
    Write-Output "  📋 Site URL clipboard'a kopyalandı"
} catch {
    # Clipboard kopyalama başarısız, önemli değil
}

Write-Output ""
Write-Output "🔧 Sorun yaşarsanız:"
Write-Output "  - Netlify dashboard: https://app.netlify.com/"
Write-Output "  - Site ayarları: https://app.netlify.com/sites/$siteId"
Write-Output "  - Functions logs: https://app.netlify.com/sites/$siteId/functions"