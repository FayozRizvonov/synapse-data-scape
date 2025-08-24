import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface AuthFormProps {
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [role, setRole] = useState<'marketing' | 'finance' | 'commercial'>('commercial');
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [companyId, setCompanyId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message === 'Invalid login credentials') {
            setError('Неверный email или пароль');
          } else {
            setError(error.message);
          }
        } else {
          onSuccess?.();
        }
      } else {
        if (!companyId) {
          setError('Пожалуйста, выберите компанию');
          return;
        }
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              role,
              company_id: companyId,
            }
          }
        });
        
        if (error) {
          if (error.message === 'User already registered') {
            setError('Пользователь с таким email уже зарегистрирован');
          } else {
            setError(error.message);
          }
        } else {
          setMessage('Проверьте вашу почту для подтверждения регистрации');
        }
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Load companies for selection when on registration view
  React.useEffect(() => {
    const loadCompanies = async () => {
      try {
        const { data, error } = await supabase.from('companies').select('id, name').order('name');
        if (!error && data) setCompanies(data);
      } catch {}
    };
    if (!isLogin) {
      loadCompanies();
    }
  }, [isLogin]);

  return (
    <Card className="w-full max-w-md mx-auto bg-white/5 border-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-shadow px-3 sm:px-6">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {isLogin ? 'Вход' : 'Регистрация'}
        </CardTitle>
        <CardDescription>
          {isLogin 
            ? 'Войдите в свой аккаунт' 
            : 'Создайте новый аккаунт'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-white/5 border-white/20 text-foreground placeholder:text-foreground/60 dark:text-white dark:placeholder:text-white/60 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-0"
            />
          </div>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="bg-white/5 border-white/20 text-foreground placeholder:text-foreground/60 dark:text-white dark:placeholder:text-white/60 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-0"
            />
          </div>

          {!isLogin && (
            <div className="grid gap-3 pt-2">
              <div className="grid gap-1">
                <Label className="text-sm text-white/80">Роль</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">commercial</SelectItem>
                    <SelectItem value="marketing">marketing</SelectItem>
                    <SelectItem value="finance">finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-sm text-white/80">Компания</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Выберите компанию" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-md shadow-lg"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            disabled={loading}
            className="p-0 text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
          >
            {isLogin 
              ? 'Нет аккаунта? Зарегистрироваться' 
              : 'Уже есть аккаунт? Войти'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};