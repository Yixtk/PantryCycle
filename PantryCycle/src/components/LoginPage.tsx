import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
  onCreateAccount: (accountData: { username: string; password: string; firstName: string; lastName: string }) => void;
}

export function LoginPage({ onLogin, onCreateAccount }: LoginPageProps) {
  const [mode, setMode] = useState<'choice' | 'login' | 'create'>('choice');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onLogin(username, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent double submission
    setIsLoading(true);
    try {
      await onCreateAccount({ username, password, firstName, lastName });
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'choice') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(to bottom, #e1e5de 0%, #f0f2ef 50%, #ffffff 100%)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-5xl mb-3" style={{ color: '#5a6b54', fontWeight: 700 }}>Pantry Cycle</h1>
            <p className="text-slate-600">Eat better, sync with your cycle</p>
          </div>

          <div className="space-y-3 bg-white p-8 rounded-2xl shadow-sm">
            <Button 
              onClick={() => setMode('create')}
              className="w-full text-white" 
              style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}
            >
              Create Account
            </Button>
            
            <Button 
              onClick={() => setMode('login')}
              variant="outline"
              className="w-full"
              style={{ borderColor: '#8a9a84', color: '#5a6b54' }}
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(to bottom, #e1e5de 0%, #f0f2ef 50%, #ffffff 100%)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl mb-3" style={{ color: '#5a6b54', fontWeight: 700 }}>Create Account</h1>
            <p className="text-slate-600">Join Pantry Cycle</p>
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-4 bg-white p-8 rounded-2xl shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="janedoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full text-white" 
              style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => setMode('choice')}
                className="text-sm hover:underline"
                style={{ color: '#5a6b54' }}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Login mode
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(to bottom, #e1e5de 0%, #f0f2ef 50%, #ffffff 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl mb-3" style={{ color: '#5a6b54', fontWeight: 700 }}>Welcome Back</h1>
          <p className="text-slate-600">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-white p-8 rounded-2xl shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="janedoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full text-white" 
            style={{ background: 'linear-gradient(135deg, #a8b5a0 0%, #8a9a84 100%)' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => setMode('choice')}
              className="text-sm hover:underline"
              style={{ color: '#5a6b54' }}
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}