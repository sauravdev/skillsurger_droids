import { Link } from 'react-router-dom';
import { Brain, User } from 'lucide-react';
import Button from './Button';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold">Skillsurger</span>
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold">Skillsurger</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <Link to="/dashboard">
              <Button variant="outline" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}