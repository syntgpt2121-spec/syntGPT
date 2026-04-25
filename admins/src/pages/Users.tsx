import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Copy, CheckCircle2, Crown, Users as UsersIcon, Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isPremium: boolean;
  premiumExpiry: string | null;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; userId: string; userEmail: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let result = users;

    // Filter by premium status
    if (filter === 'premium') {
      result = result.filter((u) => u.isPremium);
    } else if (filter === 'free') {
      result = result.filter((u) => !u.isPremium);
    }

    // Filter by search term
    const term = search.toLowerCase();
    result = result.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        u.name?.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term)
    );

    setFiltered(result);
  }, [search, users, filter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.listAll();
      setUsers(data.users);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete?.userId) return;
    const userId = confirmDelete.userId;
    try {
      setDeletingId(userId);
      setConfirmDelete(null);
      await adminApi.deleteUser(userId);
      await loadUsers();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Kullanıcı silinirken hata oluştu');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelPremium = async (userId: string) => {
    try {
      setCancellingId(userId);
      await adminApi.cancelPremium(userId);
      await loadUsers();
    } catch (error) {
      console.error('Premium iptal hatası:', error);
      alert('Premium iptal edilirken hata oluştu');
    } finally {
      setCancellingId(null);
    }
  };

  const openDeleteConfirm = (user: User) => {
    setConfirmDelete({ open: true, userId: user.id, userEmail: user.email });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('tr-TR');
    } catch {
      return iso;
    }
  };

  const premiumCount = users.filter((u) => u.isPremium).length;
  const freeCount = users.length - premiumCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tüm Kullanıcılar</h1>
          <p className="text-muted-foreground mt-1">
            <Crown className="w-4 h-4 inline text-cyan-400 mr-1" />
            {premiumCount} Premium, {freeCount} Ücretsiz
          </p>
        </div>
        <Button onClick={loadUsers} disabled={isLoading}>
          {isLoading ? 'Yükleniyor...' : 'Yenile'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          <UsersIcon className="w-4 h-4 mr-2" />
          Tümü ({users.length})
        </Button>
        <Button
          variant={filter === 'premium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('premium')}
          className={filter === 'premium' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
        >
          <Crown className="w-4 h-4 mr-2 text-cyan-400" />
          Premium ({premiumCount})
        </Button>
        <Button
          variant={filter === 'free' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('free')}
        >
          Ücretsiz ({freeCount})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' && 'Tüm Kullanıcılar'}
            {filter === 'premium' && 'Premium Kullanıcılar'}
            {filter === 'free' && 'Ücretsiz Kullanıcılar'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ara (e-posta, ad, id)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="border rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium">Durum</th>
                  <th className="text-left p-3 text-sm font-medium">E-posta</th>
                  <th className="text-left p-3 text-sm font-medium">Ad</th>
                  <th className="text-left p-3 text-sm font-medium">Kayıt Tarihi</th>
                  <th className="text-left p-3 text-sm font-medium">Bitiş Tarihi</th>
                  <th className="text-left p-3 text-sm font-medium">User ID</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Kullanıcı bulunamadı
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        {user.isPremium ? (
                          <Badge className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Ücretsiz</Badge>
                        )}
                      </td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.name || '-'}</td>
                      <td className="p-3 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {user.premiumExpiry ? formatDate(user.premiumExpiry) : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {user.id.slice(0, 8)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(user.id, user.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {copiedId === user.id ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          {!user.isPremium && (
                            <a
                              href={`/activate?userId=${user.id}`}
                              className="text-xs text-primary hover:underline ml-2"
                            >
                              Premium Yap →
                            </a>
                          )}
                          {user.isPremium && (
                            <button
                              onClick={() => handleCancelPremium(user.id)}
                              disabled={cancellingId === user.id}
                              className="text-xs text-orange-500 hover:text-orange-400 ml-2"
                              title="Premium İptal"
                            >
                              {cancellingId === user.id ? 'İptal ediliyor...' : 'Premium İptal'}
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteConfirm(user)}
                            disabled={deletingId === user.id}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Kullanıcıyı Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete?.open || false} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader className="gap-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle className="text-center text-xl text-white">Kullanıcıyı Sil</DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              <span className="font-medium text-gray-200">{confirmDelete?.userEmail}</span> kullanıcısını silmek istediğinize emin misiniz?
              <br />
              <span className="text-red-400 text-sm">Bu işlem geri alınamaz!</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              className="min-w-[100px] bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingId === confirmDelete?.userId}
              className="min-w-[100px] bg-red-600 hover:bg-red-700"
            >
              {deletingId === confirmDelete?.userId ? 'Siliniyor...' : 'Evet, Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
