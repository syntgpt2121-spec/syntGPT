import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Shield, Lock, CheckCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Payment() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Set premium status
    localStorage.setItem('isPremium', 'true');
    localStorage.setItem('premiumActivatedAt', new Date().toISOString());
    
    navigate('/payment-success');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back Button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Geri Dön
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Crown className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Premium Abonelik</h1>
          <p className="text-gray-400">Güvenli ödeme ile premium üyeliğe geçiş yapın</p>
        </div>

        {/* Order Summary */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Premium Üyelik</h3>
                <p className="text-sm text-gray-500">Aylık abonelik</p>
              </div>
            </div>
            <span className="text-xl font-bold text-white">Ücretsiz</span>
          </div>
          <div className="border-t border-[#2a2a2a] pt-4 flex items-center justify-between">
            <span className="text-gray-400">Toplam</span>
            <span className="text-2xl font-bold text-cyan-400">Ücretsiz</span>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-white">Kart Bilgileri</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-gray-300">
                Kart Numarası
              </Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="bg-[#141414] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/20 pl-10"
                  required
                />
                <CreditCard className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Card Holder */}
            <div className="space-y-2">
              <Label htmlFor="cardHolder" className="text-gray-300">
                Kart Üzerindeki İsim
              </Label>
              <Input
                id="cardHolder"
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder="AD SOYAD"
                className="bg-[#141414] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/20"
                required
              />
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry" className="text-gray-300">
                  Son Kullanma
                </Label>
                <Input
                  id="expiry"
                  type="text"
                  value={expiryDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    setExpiryDate(value);
                  }}
                  placeholder="AA/YY"
                  maxLength={5}
                  className="bg-[#141414] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv" className="text-gray-300">
                  CVV
                </Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="123"
                    maxLength={3}
                    className="bg-[#141414] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-cyan-500 focus:ring-cyan-500/20 pr-10"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-[#141414] rounded-lg">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>256-bit SSL şifreleme ile korunuyor</span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-4 rounded-xl transition-all"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  İşleniyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Güvenli Ödeme Yap
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 mt-6 text-gray-500">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>PCI DSS Uyumlu</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>SSL Güvenli</span>
          </div>
        </div>
      </div>
    </div>
  );
}
