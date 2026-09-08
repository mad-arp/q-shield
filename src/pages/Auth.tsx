import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/hooks/useAuth';

const credsSchema = z.object({
  email: z.string().trim().email({ message: 'Enter a valid email address' }).max(255),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const validate = () => {
    const parsed = credsSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({
        title: 'Check your details',
        description: parsed.error.issues[0].message,
        variant: 'destructive',
      });
      return null;
    }
    return parsed.data;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const creds = validate();
    if (!creds) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(creds);
    setLoading(false);
    if (error) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
      return;
    }
    navigate('/', { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const creds = validate();
    if (!creds) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      ...creds,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName.trim().slice(0, 60) || creds.email.split('@')[0] },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Account created', description: 'You are signed in as a Standard User.' });
    navigate('/', { replace: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast({ title: 'Google sign-in failed', description: 'Please try again.', variant: 'destructive' });
      return;
    }
    if (result.redirected) return;
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-background matrix-bg flex items-center justify-center px-4 py-10">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-lg bg-primary/20 border border-primary flex items-center justify-center pulse-glow mb-3">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl tracking-wider text-primary text-glow">Q-SHIELD ACCESS</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">SECURE OPERATOR AUTHENTICATION</p>
        </div>

        <Tabs defaultValue="signin" className="bg-card border border-border rounded-lg p-6">
          <TabsList className="grid grid-cols-2 mb-6 bg-background border border-border">
            <TabsTrigger value="signin" className="font-mono text-xs data-[state=active]:text-primary">SIGN IN</TabsTrigger>
            <TabsTrigger value="signup" className="font-mono text-xs data-[state=active]:text-primary">REGISTER</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="font-mono text-xs">EMAIL</Label>
                <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="font-mono text-xs">PASSWORD</Label>
                <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={72} className="font-mono" />
              </div>
              <Button type="submit" disabled={loading} className="w-full font-mono tracking-wide">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} AUTHENTICATE
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="font-mono text-xs">DISPLAY NAME</Label>
                <Input id="signup-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="font-mono text-xs">EMAIL</Label>
                <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="font-mono text-xs">PASSWORD</Label>
                <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={72} className="font-mono" />
              </div>
              <Button type="submit" disabled={loading} className="w-full font-mono tracking-wide">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} CREATE ACCOUNT
              </Button>
            </form>
          </TabsContent>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-card px-2 text-muted-foreground font-mono">or</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleGoogle} disabled={loading} className="w-full font-mono tracking-wide">
            CONTINUE WITH GOOGLE
          </Button>
        </Tabs>

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-xs font-mono text-muted-foreground hover:text-primary mt-6"
        >
          Continue without an account (local mode)
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
