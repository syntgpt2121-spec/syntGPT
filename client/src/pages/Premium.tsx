import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, CheckCircle, ArrowLeft, CreditCard, Sparkles, Shield, Clock, Lock } from "lucide-react";

export default function Premium() {
  const navigate = useNavigate();
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const iban = "TR12 3456 7890 1234 5678 9012 34";
  const accountName = "Ahmet Yılmaz";
  const price = "99₺";

  const copyIBAN = () => {
    navigator.clipboard.writeText(iban.replace(/\s/g, ''));
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const copyReference = () => {
    navigator.clipboard.writeText(referenceCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const referenceCode = `SYN-${user.id?.slice(0, 8).toUpperCase() || 'USER'}`;

  return (
    <div className="min-h-screen bg-[#0d0d0d] overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <button 
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group"
          >
            <div className="p-2 rounded-full bg-[#1a1a1a] group-hover:bg-[#2a2a2a] transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Sohbete Dön</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Güvenli Ödeme</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">Sınırları Aşın</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            SyntGPT <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Premium</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Yapay zeka gücünü sonuna kadar kullanın. Sınırsız sohbet, öncelikli destek ve çok daha fazlası.
          </p>

          <div className="inline-flex items-baseline gap-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-8 py-4 rounded-2xl border border-cyan-500/30">
            <span className="text-5xl font-bold text-white">{price}</span>
            <span className="text-xl text-gray-400">/ay</span>
          </div>
        </section>

        {/* Comparison Cards - REMOVED */}
        {/* Payment Section */}
        <section className="max-w-2xl mx-auto">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#2a2a2a] bg-[#0f0f0f]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Havale / EFT ile Ödeme</h3>
                  <p className="text-sm text-gray-500">7/24 güvenli ödeme altyapısı</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-medium">IBAN</label>
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between gap-4">
                  <code className="text-white font-mono text-lg tracking-wider">{iban}</code>
                  <button
                    onClick={copyIBAN}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all font-medium"
                  >
                    {copiedIban ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-medium">Hesap Sahibi</label>
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4">
                  <p className="text-white font-medium text-lg">{accountName}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Ödeme Referans Kodu</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Havale/EFT yaparken açıklama kısmına mutlaka bu kodu ekleyin:
                </p>
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between gap-4">
                  <code className="text-cyan-400 font-mono text-xl font-bold tracking-wider">{referenceCode}</code>
                  <button
                    onClick={copyReference}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all font-medium"
                  >
                    {copiedRef ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 pt-2">
                {[
                  { num: "01", text: `${price} tutarında havale/EFT yapın` },
                  { num: "02", text: `Açıklamaya "${referenceCode}" yazın` },
                  { num: "03", text: "1-2 iş günü içinde premium aktif edilir" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm">
                    <span className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-blue-400 flex items-center justify-center text-xs font-bold">
                      {step.num}
                    </span>
                    <span className="text-gray-300">{step.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-500 pt-4 border-t border-[#2a2a2a]">
                <Shield className="w-5 h-5 text-green-400" />
                <span>256-bit SSL şifreleme ile korunmaktadır</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Yardıma mı ihtiyacınız var?{" "}
              <a href="mailto:syntgpt2121@gmail.com" className="text-blue-400 hover:text-blue-300 font-medium">
                syntgpt2121@gmail.com
              </a>
            </p>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-[#2a2a2a] text-center">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" /> Güvenli Ödeme
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> 7/24 Destek
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Anında Aktivasyon
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
