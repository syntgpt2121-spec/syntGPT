import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, CheckCircle, AlertCircle, Sparkles, Calendar, CreditCard, Hash } from 'lucide-react';

export default function Activate() {
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState(searchParams.get('userId') || '');
  const [months, setMonths] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('havale');
  const [paymentReference, setPaymentReference] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const data: { subscription: { expiresAt: string } } = await adminApi.activatePremium({
        userId: userId.trim(),
        months: parseInt(months),
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
      }) as { subscription: { expiresAt: string } };

      setResult({
        success: true,
        message: `Premium aktif edildi! Bitiş: ${new Date(data.subscription.expiresAt).toLocaleDateString('tr-TR')}`,
      });

      setUserId('');
      setPaymentReference('');
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Aktifleştirme başarısız',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
          <Crown className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Premium Aktifleştir</h1>
        <p className="text-gray-400 text-sm">Kullanıcıya premium üyelik tanımlayın</p>
      </div>

      {/* Card */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User ID */}
          <div className="space-y-2">
            <Label htmlFor="userId" className="text-gray-300 flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-400" />
              Kullanıcı UUID
            </Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Kullanıcı UUID girin"
              className="bg-[#141414] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-blue-500/20"
              required
            />
          </div>

          {/* Months & Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="months" className="text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Ay Sayısı
              </Label>
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger className="bg-[#141414] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="1" className="text-white">1 Ay</SelectItem>
                  <SelectItem value="3" className="text-white">3 Ay</SelectItem>
                  <SelectItem value="6" className="text-white">6 Ay</SelectItem>
                  <SelectItem value="12" className="text-white">12 Ay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method" className="text-gray-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                Ödeme
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-[#141414] border-[#2a2a2a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="havale" className="text-white">Havale</SelectItem>
                  <SelectItem value="eft" className="text-white">EFT</SelectItem>
                  <SelectItem value="kart" className="text-white">Kredi Kartı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference" className="text-gray-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Referans Kodu <span className="text-gray-500 text-xs">(opsiyonel)</span>
            </Label>
            <Input
              id="reference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="SYN-XXXX"
              className="bg-[#141414] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 ${
                result.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm">{result.message}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !userId.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                İşleniyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Premium Aktifleştir
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* Info */}
      <div className="mt-6 text-center">
        <p className="text-gray-500 text-xs">
          Kullanıcı ID'sini Users sayfasından kopyalayabilirsiniz
        </p>
      </div>
    </div>
  );
}
