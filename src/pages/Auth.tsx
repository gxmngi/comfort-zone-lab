import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'user' | 'doctor'>('user');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({ title: 'Error', description: validation.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = isLogin 
      ? await signIn(email, password)
      : await signUp(email, password, firstName, lastName, role);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      // Navigate to root to let RoleBasedRedirect handle the routing based on role
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm rounded-2xl p-6 mb-8 inline-flex items-center justify-center gap-8">
            <img src="/itd-logo.png" alt="ITD Logo" className="h-16 w-auto object-contain" />
            <div className="w-px h-10 bg-border/50"></div>
            <img src="/walai-logo.png" alt="Walai Logo" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="font-display text-3xl font-bold">ComfortMonitor</h1>
          <p className="text-muted-foreground mt-2">Personal Comfort Level Monitoring</p>
        </div>
        <div className="medical-card">
          <h2 className="font-display text-xl font-semibold mb-6">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" /></div>
                  <div><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" /></div>
                </div>
                <div className="space-y-2">
                   <Label>I am a:</Label>
                   <div className="flex gap-4">
                      <label className={`flex items-center justify-center border rounded-lg p-3 flex-1 cursor-pointer transition-all ${role === 'user' ? 'bg-primary/5 border-primary text-primary font-medium ring-1 ring-primary' : 'bg-background hover:bg-muted'}`}>
                        <input type="radio" name="role" value="user" checked={role === 'user'} onChange={() => setRole('user')} className="sr-only" />
                        Patient
                      </label>
                      <label className={`flex items-center justify-center border rounded-lg p-3 flex-1 cursor-pointer transition-all ${role === 'doctor' ? 'bg-primary/5 border-primary text-primary font-medium ring-1 ring-primary' : 'bg-background hover:bg-muted'}`}>
                        <input type="radio" name="role" value="doctor" checked={role === 'doctor'} onChange={() => setRole('doctor')} className="sr-only" />
                        Doctor
                      </label>
                   </div>
                </div>
              </>
            )}
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            {!isLogin && (
               <div>
                 <Label>Confirm Password</Label>
                 <div className="relative">
                   <Input 
                     type={showConfirmPassword ? "text" : "password"} 
                     value={confirmPassword} 
                     onChange={(e) => setConfirmPassword(e.target.value)} 
                     placeholder="••••••••" 
                     required 
                   />
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                 </div>
               </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">{isLogin ? 'Sign up' : 'Sign in'}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
