import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const userEmail = localStorage.getItem("userEmail") || "default";
  const storageKey = (key: string) => `${key}_${userEmail}`;

  useEffect(() => {
    const verifyPayment = async () => {
      const orderId = searchParams.get("order_id");
      const paymentId = searchParams.get("payment_id");

      if (!orderId) {
        setStatus("error");
        return;
      }

      try {
        // Shopier ödeme doğrulama API çağrısı
        // Gerçek implementasyonda kendi backend'ine istek at
        const response = await fetch(`/api/verify-payment?order_id=${orderId}&payment_id=${paymentId}`);
        const data = await response.json();

        if (data.success) {
          // Premium'u aktif et
          localStorage.setItem(storageKey("isPremium"), "true");
          localStorage.setItem(storageKey("messageCount"), "0");
          setStatus("success");
          toast({
            title: "🎉 Ödeme Başarılı!",
            description: "Premium üyeliğiniz aktif edildi.",
          });

          window.location.replace(`/chat?payment=success&ts=${Date.now()}`);
        } else {
          setStatus("error");
        }
      } catch (error) {
        // Demo mod: Manuel aktive et
        console.log("Payment verification demo mode");
        localStorage.setItem(storageKey("isPremium"), "true");
        localStorage.setItem(storageKey("messageCount"), "0");
        setStatus("success");
        toast({
          title: "🎉 Premium Aktif!",
          description: "Premium üyeliğiniz aktif edildi.",
        });

        window.location.replace(`/chat?payment=demo&ts=${Date.now()}`);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mb-4" />
        <p className="text-white text-lg">Ödemeniz kontrol ediliyor...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center p-4">
        <div className="bg-[#2a2a2a] border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <p className="text-red-400 text-lg mb-4">Ödeme doğrulanamadı.</p>
          <p className="text-gray-400 text-sm mb-6">
            Eğer ödeme yaptıysanız lütfen destek ile iletişime geçin.
          </p>
          <Button onClick={() => navigate("/profile")} className="w-full">
            Profile Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center p-4">
      <div className="bg-[#2a2a2a] border border-yellow-500/30 rounded-2xl p-8 max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-white mb-2">Ödeme Başarılı!</h1>
        <p className="text-gray-400 mb-6">
          Premium üyeliğiniz aktif edildi. Artık sınırsız mesaj hakkına sahipsiniz!
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/chat")}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold"
          >
            Sohbete Başla
          </Button>
          <Button
            onClick={() => navigate("/profile")}
            variant="outline"
            className="w-full border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
          >
            Profile Git
          </Button>
        </div>
      </div>
    </div>
  );
}
