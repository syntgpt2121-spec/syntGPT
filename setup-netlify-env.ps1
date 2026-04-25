# SyntGPT Netlify Ortam Değişkenleri Yapılandırma Script'i
# Bu script Netlify CLI kullanarak SMTP ayarlarını otomatik yapılandırır

param(
    [Parameter(Mandatory=$false)]
    [string]$SiteId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpUser = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SmtpPass = "",
    
    [Parameter(Mandatory=$false)]
    [string]$GroqApiKey = ""
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "🚀 SyntGPT Netlify Yapılandırma Script'i"
Write-Output "========================================`n"

# Netlify CLI kontrolü
Write-Output "📦 Netlify CLI kontrol ediliyor..."
$netlifyVersion = netlify --version 2>$null
if (-not $netlifyVersion) {
    Write-ColorOutput Yellow "⚠️  Netlify CLI bulunamadı. Yükleniyor..."
    npm install -g netlify-cli
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Netlify CLI yüklenemedi. Manuel olarak yükleyin:"
        Write-Output "   npm install -g netlify-cli"
        exit 1
    }
}
Write-ColorOutput Green "✅ Netlify CLI kurulu`n"

# Login kontrolü
Write-Output "🔐 Netlify login durumu kontrol ediliyor..."
$loginStatus = netlify status 2>&1
if ($loginStatus -match "Not logged in") {
    Write-ColorOutput Yellow "⚠️  Netlify'e giriş yapılmamış. Giriş yapmanız gerekiyor..."
    netlify login
}
Write-ColorOutput Green "✅ Giriş yapılmış`n"

# Site ID belirleme
if (-not $SiteId) {
    Write-Output "📋 Mevcut Netlify siteleri listeleniyor..."
    $sites = netlify sites:list --json | ConvertFrom-Json
    
    if ($sites.Count -eq 0) {
        Write-ColorOutput Red "❌ Hiç site bulunamadı. Önce bir site oluşturun veya SiteId parametresi girin."
        exit 1
    }
    
    if ($sites.Count -eq 1) {
        $SiteId = $sites[0].id
        $siteName = $sites[0].name
        Write-ColorOutput Green "✅ Tek site bulundu: $siteName`n"
    } else {
        Write-Output "Birden fazla site bulundu. Lütfen birini seçin:"
        for ($i = 0; $i -lt $sites.Count; $i++) {
            Write-Output "  [$i] $($sites[$i].name) ($($sites[$i].id))"
        }
        $selection = Read-Host "Site numarası (0-$($sites.Count-1))"
        $SiteId = $sites[$selection].id
        $siteName = $sites[$selection].name
        Write-ColorOutput Green "✅ Seçilen site: $siteName`n"
    }
}

# SMTP kullanıcı adı
if (-not $SmtpUser) {
    $SmtpUser = Read-Host "📧 SMTP kullanıcı adı (e-posta adresiniz, örn: syntgptt@gmail.com)"
}

# SMTP şifresi
if (-not $SmtpPass) {
    Write-Output ""
    Write-ColorOutput Yellow "⚠️  ÖNEMLİ: Gmail kullanıyorsaniz, bu normal şifreniz DEĞIL!"
    Write-Output "   Google Hesabı > Güvenlik > 2 Adımlı Doğrulama > Uygulama şifreleri"
    Write-Output "   bölümünden aldığınız 16 karakterli şifreyi girin."
    Write-Output ""
    $secureSmtpPass = Read-Host "🔑 SMTP şifresi (Gmail App Password)" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSmtpPass)
    try {
        $SmtpPass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

# GROQ API Key
if (-not $GroqApiKey) {
    $GroqApiKey = Read-Host "🤖 Groq API Key (boş bırakabilirsiniz, sonra eklenir)"
}

Write-Output ""
Write-ColorOutput Cyan "📝 Ortam değişkenleri ayarlanıyor..."

# Ortam değişkenlerini ayarla
$envVars = @(
    @{ key = "SMTP_HOST"; value = "smtp.gmail.com" },
    @{ key = "SMTP_PORT"; value = "587" },
    @{ key = "SMTP_USER"; value = $SmtpUser },
    @{ key = "APP_NAME"; value = "SyntGPT" },
    @{ key = "FROM_EMAIL"; value = $SmtpUser }
)

if ($SmtpPass) {
    $envVars += @{ key = "SMTP_PASS"; value = $SmtpPass }
}

if ($GroqApiKey) {
    $envVars += @{ key = "GROQ_API_KEY"; value = $GroqApiKey }
}

foreach ($env in $envVars) {
    Write-Output "   → $($env.key) ayarlanıyor..."
    $result = netlify env:set $($env.key) "$($env.value)" --scope functions --site $SiteId 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "   ❌ Hata: $result"
    } else {
        Write-ColorOutput Green "   ✅ $($env.key) ayarlandı"
    }
}

Write-Output ""
Write-ColorOutput Green "🎉 Yapılandırma tamamlandı!"
Write-Output ""
Write-ColorOutput Cyan "📌 Sonraki adımlar:"
Write-Output "   1. Siteyi yeniden deploy edin: netlify deploy --prod"
Write-Output "   2. Veya Git push yaparak otomatik deploy'u bekleyin"
Write-Output ""
Write-Output "✅ Doğrulama e-posta özelliği artık çalışmalı!"
