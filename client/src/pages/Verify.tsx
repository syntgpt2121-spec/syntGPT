import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Verify() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const email = sessionStorage.getItem("pendingRegisterEmail") || "";
  const name = sessionStorage.getItem("pendingRegisterName") || "";
  const password = sessionStorage.getItem("pendingRegisterPassword") || "";
  const expectedCode = sessionStorage.getItem("pendingRegisterCode") || "";

  useEffect(() => {
    if (!email || !expectedCode) {
      navigate("/login");
    }
  }, [email, expectedCode, navigate]);

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!code.trim()) {
      setError("Doğrulama kodu gereklidir");
      setIsLoading(false);
      return;
    }

    if (code.length !== 6) {
      setError("Doğrulama kodu 6 haneli olmalıdır");
      setIsLoading(false);
      return;
    }

    if (code !== expectedCode) {
      setError("Doğrulama kodu hatalı! Lütfen e-postanızı kontrol edin.");
      setIsLoading(false);
      return;
    }

    // Kullanıcıyı kayıtlı kullanıcılar listesine eklemeden önce tekrar kontrol et
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userExists = registeredUsers.some((user: any) => user.email === email);
    if (userExists) {
      setError("Bu e-posta adresi ile zaten kayıtlı bir kullanıcı var. Lütfen giriş yapın.");
      setIsLoading(false);
      return;
    }
    registeredUsers.push({ email, name, password });
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    localStorage.setItem("isLoggedIn", "true");
    if (name) localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);

    sessionStorage.removeItem("pendingRegisterEmail");
    sessionStorage.removeItem("pendingRegisterName");
    sessionStorage.removeItem("pendingRegisterPassword");
    sessionStorage.removeItem("pendingRegisterCode");

    setIsLoading(false);
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 form-slide-in">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden flex items-center justify-center">
            <img src="/logo.jpg" alt="SyntGPT" className="w-full h-full object-cover scale-[1.5] translate-y-2" />
          </div>
          <h1 className="text-2xl font-bold text-white">SyntGPT</h1>
          <p className="text-gray-400 text-sm mt-1">Doğrulama kodunu girin</p>
        </div>

        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-6 shadow-2xl form-slide-in">
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{email}</span>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
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

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Doğrulama Kodu</label>
              <div className="relative">
                <Shield className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ''));
                    setError("");
                  }}
                  placeholder="123456"
                  maxLength={6}
                  className={`w-full bg-[#1a1a1a] border rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none transition-colors ${
                    error ? 'border-red-500 focus:border-red-400' : 'border-[#3a3a3a] focus:border-blue-500'
                  }`}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">E-posta adresinize gönderilen 6 haneli kodu girin</p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  Doğrulanıyor...
                </div>
              ) : "Doğrula"}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#3a3a3a] text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-gray-400 hover:text-gray-200 text-sm font-medium"
            >
              Geri dön
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
