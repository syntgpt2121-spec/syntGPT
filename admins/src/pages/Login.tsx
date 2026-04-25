import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, error } = useAuth();

  const doLogin = async () => {
    if (!key.trim()) {
      setLocalError('Key girmelisiniz');
      return;
    }

    setIsLoading(true);
    setLocalError('');
    
    try {
      await login(key.trim());
    } catch (err: any) {
      const msg = err.message || 'Giriş başarısız';
      setLocalError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Admin Girişi</CardTitle>
              <CardDescription>
                SyntGPT yönetim paneline erişmek için admin anahtarını girin
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showKey ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="admin-secret"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bu anahtar sadece tarayıcı sessionStorage&apos;ında saklanır.
                </p>
              </div>

              {(error || localError) && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error || localError}
                </div>
              )}

              <Button
                className="w-full"
                disabled={isLoading || !key.trim()}
                onClick={doLogin}
              >
                {isLoading ? 'Yükleniyor...' : 'Giriş Yap'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
