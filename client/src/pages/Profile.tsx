import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, User, Mail, Shield, Camera, LogOut, Trash2, Pencil, Crown, CreditCard, 
  Calendar, Sparkles, Zap, Clock, XCircle, AlertTriangle, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Profile() {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Kullanıcı");
  const [userEmail, setUserEmail] = useState<string>("user@email.com");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState<string>("");
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<string | null>(null);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [showClearChatDialog, setShowClearChatDialog] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState<string>("");
  const [noticeDescription, setNoticeDescription] = useState<string>("");
  const [noticeVariant, setNoticeVariant] = useState<'default' | 'destructive'>('default');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storageKey = (key: string) => `${key}_${userEmail || "default"}`;

  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    const savedEmail = localStorage.getItem("userEmail");
    if (savedName?.trim()) setUserName(savedName);
    if (savedEmail?.trim()) setUserEmail(savedEmail);
  }, []);

  useEffect(() => {
    const savedAvatar = localStorage.getItem(storageKey("userAvatar"));
    setAvatar(savedAvatar);
  }, [userEmail]);

  useEffect(() => {
    const savedPremium = localStorage.getItem(storageKey("isPremium"));
    setIsPremium(savedPremium === "true");
    const savedExpiry = localStorage.getItem(storageKey("premiumExpiry"));
    if (savedExpiry) setPremiumExpiry(savedExpiry);
  }, [userEmail]);

  useEffect(() => {
    setNameDraft(userName);
  }, [userName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatar(base64);
        localStorage.setItem(storageKey("userAvatar"), base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    const next = nameDraft.trim();
    if (!next) return;
    setUserName(next);
    localStorage.setItem("userName", next);
    setEditingName(false);
  };

  const handleLogout = () => {
    navigate('/logout');
  };

  const showNotice = (payload: { title: string; description: string; variant?: 'default' | 'destructive' }) => {
    setNoticeTitle(payload.title);
    setNoticeDescription(payload.description);
    setNoticeVariant(payload.variant ?? 'default');
    setNoticeOpen(true);
  };

  const handleClearChatHistory = () => {
    setShowClearChatDialog(true);
  };

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/chat')}
            className="w-9 h-9 text-gray-400 hover:text-white hover:bg-[#3a3a3a] rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Profil</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group mb-3"
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white font-bold text-3xl">
                {(userName?.trim()?.[0] || "U").toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <h2 className="text-lg font-semibold text-white">{userName}</h2>
          <p className="text-gray-400 text-sm">{userEmail}</p>
        </div>

        {/* Info Cards */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">Kullanıcı Adı</p>
              {editingName ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="flex-1 bg-[#0f0f0f] border border-[#3a3a3a] rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ad Soyad"
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleSaveName}
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                  >
                    Kaydet
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm">{userName}</p>
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    className="text-gray-400 hover:text-white"
                    aria-label="İsmi düzenle"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">E-posta</p>
              <p className="text-white text-sm">{userEmail}</p>
            </div>
          </div>

          {/* Premium Status Card - Sadece Premium kullanıcılarda göster */}
          {isPremium && (
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-4 border border-cyan-500/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Premium</p>
                    <p className="text-xs text-cyan-400">Aktif Abonelik</p>
                  </div>
                </div>
                {premiumExpiry && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Bitiş</p>
                    <p className="text-sm text-cyan-400 font-medium">{new Date(premiumExpiry).toLocaleDateString('tr-TR')}</p>
                  </div>
                )}
              </div>
              
              {/* Benefits */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-[#0f0f1a]/50 rounded-lg p-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs text-gray-300">Sınırsız mesaj</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0f0f1a]/50 rounded-lg p-2">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs text-gray-300">Hızlı yanıt</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0f0f1a]/50 rounded-lg p-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs text-gray-300">Öncelikli destek</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0f0f1a]/50 rounded-lg p-2">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs text-gray-300">Gelişmiş AI</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-cyan-500/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                  className="flex-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-xs h-8"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  İptal Et
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComplaintDialog(true)}
                  className="flex-1 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 text-xs h-8"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Şikayet
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Hesap</p>
              <p className="text-white text-sm">{isPremium ? 'Premium' : 'Ücretsiz'}</p>
            </div>
            {isPremium && <Crown className="w-5 h-5 text-cyan-400" />}
          </div>

          {/* Delete Account */}
          <div className="border border-red-500/30 rounded-lg p-2 bg-red-500/10">
            <Button
              variant="ghost"
              onClick={handleClearChatHistory}
              className="w-full justify-start text-gray-200 hover:text-white h-8 text-sm bg-transparent hover:bg-transparent"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sohbet geçmişini temizle
            </Button>
          </div>

        </div>

        {/* Logout */}
        <div className="mt-6 pt-4 border-t border-[#3a3a3a]">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-red-400 hover:text-red-300 hover:bg-[#3a3a3a]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </div>

      {/* Pricing Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold text-white text-center">
              Abonelik Planları
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Size en uygun planı seçin ve sınırsız sohbetin keyfini çıkarın
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 pt-2">
            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Plan */}
              <div className="relative bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#3a3a3a] transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                    <Crown className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Ücretsiz</h3>
                    <p className="text-sm text-gray-500">Başlangıç planı</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">0₺</span>
                  <span className="text-gray-400">/ay</span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Günlük 5 mesaj
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Temel AI yanıtları
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Sohbet geçmişi
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    Öncelikli destek
                  </li>
                </ul>

                <Button 
                  disabled={!isPremium}
                  variant="outline"
                  className="w-full bg-transparent border-[#3a3a3a] text-white hover:bg-[#2a2a2a] disabled:opacity-50"
                >
                  {!isPremium ? 'Mevcut Plan' : "Ücretsiz'e Dön"}
                </Button>
              </div>

              {/* Premium Plan - Clean Design */}
              <div className="relative bg-[#1a1a1a] border border-cyan-500/50 rounded-2xl p-6">
                {/* Popular badge */}
                <div className="absolute -top-3 right-6 bg-cyan-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  EN POPÜLER
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Premium</h3>
                    <p className="text-sm text-cyan-400">Profesyonel deneyim</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">Ücretsiz</span>
                  <span className="text-gray-400">/ay</span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="font-medium text-white">Sınırsız mesaj</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Gelişmiş AI modeli
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Öncelikli destek
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Daha hızlı yanıtlar
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    Uzun sohbetler desteği
                  </li>
                </ul>

                <Button 
                  onClick={() => {
                    navigate('/payment');
                  }}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all"
                >
                  <CreditCard className="w-4 h-4 mr-2" /> 
                  Premium'a Yükselt
                </Button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  Ödeme sonrası premium otomatik aktif olur
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#3a3a3a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              Premium İptal Et
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Premium aboneliğinizi iptal etmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
              <p className="text-xs text-cyan-400 mb-1">Mevcut Abonelik</p>
              <p className="text-sm text-white">{premiumExpiry ? `Bitiş: ${new Date(premiumExpiry).toLocaleDateString('tr-TR')}` : 'Aktif Premium'}</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]"
              >
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  localStorage.removeItem(storageKey("isPremium"));
                  localStorage.removeItem(storageKey("premiumExpiry"));
                  setIsPremium(false);
                  setPremiumExpiry(null);
                  setShowCancelDialog(false);
                  showNotice({
                    title: "Premium iptal edildi",
                    description: "Aboneliğiniz sona erdi.",
                  });
                }}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                İptal Et
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#3a3a3a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-400">
              <AlertTriangle className="w-5 h-5" />
              Şikayet Bildir
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Premium aboneliğinizle ilgili şikayetinizi bildirin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Şikayetinizi buraya yazın..."
              className="w-full h-32 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowComplaintDialog(false)}
                className="flex-1 border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]"
              >
                İptal
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const storedUser = localStorage.getItem('user');
                    const parsedUser = storedUser ? (JSON.parse(storedUser) as { id?: string } | null) : null;
                    const effectiveUserId = parsedUser?.id;

                    if (!effectiveUserId) {
                      showNotice({
                        title: "Hata",
                        description: "Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.",
                        variant: "destructive",
                      });
                      return;
                    }

                    const response = await fetch(`${API_BASE_URL}/api/admin/submit-complaint`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: effectiveUserId,
                        userEmail: userEmail,
                        message: complaintText,
                      }),
                    });
                    
                    if (response.ok) {
                      setComplaintText("");
                      setShowComplaintDialog(false);
                      showNotice({
                        title: "Şikayet gönderildi",
                        description: "Geribildiriminiz için teşekkürler.",
                      });
                    } else {
                      throw new Error('Failed to submit complaint');
                    }
                  } catch (error) {
                    console.error('Error submitting complaint:', error);
                    showNotice({
                      title: "Hata",
                      description: "Şikayet gönderilirken bir hata oluştu.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!complaintText.trim()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4 mr-2" />
                Gönder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Chat History Confirm Dialog */}
      <Dialog open={showClearChatDialog} onOpenChange={setShowClearChatDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#3a3a3a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Sohbet geçmişi silinsin mi?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bu işlem geri alınamaz. Tüm sohbet geçmişiniz silinecek.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowClearChatDialog(false)}
              className="flex-1 border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a]"
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                localStorage.removeItem(storageKey("chatHistory"));
                setShowClearChatDialog(false);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent className={`bg-[#1a1a1a] border-[#3a3a3a] text-white max-w-md ${noticeVariant === 'destructive' ? 'border-red-500/40' : ''}`}>
          <DialogHeader>
            <DialogTitle className={noticeVariant === 'destructive' ? 'text-red-400' : 'text-white'}>
              {noticeTitle}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {noticeDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button
              onClick={() => setNoticeOpen(false)}
              className={`w-full ${noticeVariant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
            >
              Tamam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
