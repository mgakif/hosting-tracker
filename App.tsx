
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Project } from './types';
import { AlertCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAppLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProjects = async () => {
    if (!isSupabaseConfigured() || !session) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('projects')
        .select('*')
        .order('expiration_date', { ascending: true });

      if (supabaseError) {
        setError(`Veri çekme hatası: ${supabaseError.message}`);
      } else {
        setProjects(data || []);
      }
    } catch (err: any) {
      setError('Veri tabanına bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [currentView, session]);

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <Layout activeView={currentView} onNavigate={setCurrentView} userEmail={session.user.email}>
      {currentView === 'dashboard' ? (
        <div className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 text-rose-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Bir Hata Oluştu</p>
                <p className="text-xs font-medium opacity-90">{error}</p>
              </div>
            </div>
          )}
          <Dashboard 
            projects={projects} 
            onRefresh={fetchProjects} 
            loading={loading}
          />
        </div>
      ) : (
        <Settings />
      )}
    </Layout>
  );
};

export default App;
