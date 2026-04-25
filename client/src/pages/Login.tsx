import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Lock, Mail, ArrowRight, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletedMessage, setDeletedMessage] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [userId, setUserId] = useState("");

  // Check for deleted account message
  useEffect(() => {
    if (searchParams.get('deleted') === 'true') {
      setDeletedMessage('Hesabınız silinmiş. Lütfen tekrar kayıt olun.');
      // Clear the URL parameter
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!name.trim()) {
      setError("Ad soyad gereklidir");
      setIsLoading(false);
      return;
    }

    if (name.trim().length < 2) {
      setError("Ad soyad en az 2 karakter olmalıdır");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Geçerli bir e-posta adresi girin");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt sırasında bir hata oluştu');
      }

      setUserId(data.userId);
      setVerificationStep(true);
      setIsLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Kayıt sırasında bir hata oluştu');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Geçerli bir e-posta adresi girin");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          setUserId(data.userId);
          setVerificationStep(true);
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || 'Giriş sırasında bir hata oluştu');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', data.user.email);

      navigate('/chat');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Giriş sırasında bir hata oluştu');
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Doğrulama sırasında bir hata oluştu');
      }

      // Save user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('emailVerified', 'true');

      // Navigate to chat
      navigate('/chat', { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Doğrulama sırasında bir hata oluştu');
      setIsLoading(false);
    }
  };

  if (verificationStep) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => {
              setVerificationStep(false);
              setVerificationCode('');
              setError('');
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri Dön
          </button>

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden flex items-center justify-center">
              <img src="/logo.jpg" alt="SyntGPT" className="w-full h-full object-cover scale-[1.5] translate-y-2" />
            </div>
            <h1 className="text-2xl font-bold text-white">E-posta Doğrulama</h1>
            <p className="text-gray-400 text-sm mt-1">{email} adresine gönderilen 6 haneli kodu girin</p>
          </div>

          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-6 shadow-2xl">
            <form onSubmit={handleVerify} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Professional Code Input */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400 block text-center">Doğrulama Kodu</label>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={verificationCode[index] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(-1);
                        const newCode = verificationCode.split('');
                        newCode[index] = val;
                        const newCodeStr = newCode.join('').slice(0, 6);
                        setVerificationCode(newCodeStr);
                        if (val && index < 5) {
                          const nextInput = document.getElementById(`code-${index + 1}`);
                          if (nextInput) nextInput.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          if (!verificationCode[index] && index > 0) {
                            e.preventDefault();
                            const prevInput = document.getElementById(`code-${index - 1}`);
                            if (prevInput) {
                              const newCode = verificationCode.split('');
                              newCode[index - 1] = '';
                              setVerificationCode(newCode.join('').slice(0, 6));
                              prevInput.focus();
                            }
                          } else if (verificationCode[index]) {
                            e.preventDefault();
                            const newCode = verificationCode.split('');
                            newCode[index] = '';
                            setVerificationCode(newCode.join('').slice(0, 6));
                          }
                        }
                      }}
                      id={`code-${index}`}
                      className="w-12 h-14 bg-[#1a1a1a] border-2 border-[#3a3a3a] rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Kod e-posta adresinize gönderildi
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white py-3 rounded-xl font-medium"
              >
                {isLoading ? "Doğrulanıyor..." : "Doğrula"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 form-slide-in">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden flex items-center justify-center">
            <img src="/logo.jpg" alt="SyntGPT" className="w-full h-full object-cover scale-[1.5] translate-y-2" />
          </div>
          <h1 className="text-2xl font-bold text-white">SyntGPT</h1>
          <p className="text-gray-400 text-sm mt-1">
            {isLogin ? "Hesabınıza giriş yapın" : "Yeni hesap oluşturun"}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-6 shadow-2xl form-slide-in">
          <form onSubmit={isLogin ? handleLogin : handleRegisterSubmit} className="space-y-4">
            {/* Account Deleted Message */}
            {deletedMessage && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                <p className="text-orange-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {deletedMessage}
                </p>
              </div>
            )}
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 error-slide-in">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}
            {/* Name - only for register */}
            {!isLogin && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Ad Soyad</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    placeholder="Adınız"
                    className={`w-full bg-[#1a1a1a] border rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none transition-colors ${
                      error ? 'border-red-500 focus:border-red-400' : 'border-[#3a3a3a] focus:border-blue-500'
                    }`}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">E-posta</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="örnek@eposta.com"
                  className={`w-full bg-[#1a1a1a] border rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none transition-colors ${
                    error ? 'border-red-500 focus:border-red-400' : 'border-[#3a3a3a] focus:border-blue-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Şifre</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-[#1a1a1a] border rounded-lg pl-10 pr-12 py-3 text-white placeholder:text-gray-500 focus:outline-none transition-colors [&::-webkit-textfield-decoration-container]:hidden [&::-webkit-password-reveal-button]:hidden [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                    error ? 'border-red-500 focus:border-red-400' : 'border-[#3a3a3a] focus:border-blue-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors no-hover-animation"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
            >
              {isLogin ? "Giriş Yap" : isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  Gönderiliyor...
                </div>
              ) : "Kayıt Ol"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 pt-4 border-t border-[#3a3a3a] text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-1"
            >
              {isLogin ? "Kayıt Ol" : "Giriş Yap"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
