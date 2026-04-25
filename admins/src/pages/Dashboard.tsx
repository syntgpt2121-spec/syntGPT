import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Crown, UserCheck } from 'lucide-react';

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminApi.stats();
      setStats(data);
    } catch (err: any) {
      console.error('İstatistikler yüklenemedi:', err.message || 'Giriş başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats?.totalUsers ?? '-',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Premium Kullanıcı',
      value: stats?.premiumUsers ?? '-',
      icon: Crown,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
    {
      title: 'Ücretsiz Kullanıcı',
      value: stats?.freeUsers ?? '-',
      icon: UserCheck,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Kontrol Paneli</h1>
        <button
          onClick={loadStats}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Yenile
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? 'Yükleniyor...' : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <a
            href="/activate"
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">Premium Aktifleştir</div>
              <div className="text-sm text-muted-foreground">
                Havale/EFT sonrası kullanıcıyı premium yap
              </div>
            </div>
          </a>

          <a
            href="/users"
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-medium">Bekleyen Kullanıcılar</div>
              <div className="text-sm text-muted-foreground">
                Premium olmayan kullanıcıları görüntüle
              </div>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
