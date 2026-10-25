
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { api } from './api';
import { Project } from './types';
import { AlertCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');

  useEffect(() => {
    // Mevcut oturumu kontrol et
    api.me()
      .then(({ email }) => setUserEmail(email))
      .catch(() => setUserEmail(null))
      .finally(() => setAppLoading(false));
  }, []);

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    setUserEmail(null);
    setProjects([]);
  };

  const fetchProjects = async () => {
    if (!userEmail) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setProjects(await api.listProjects());
    } catch (err: any) {
      setError(`Veri çekme hatası: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchProjects();
    }
  }, [currentView, userEmail]);

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!userEmail) {
    return <Auth onLogin={setUserEmail} />;
  }

  return (
    <Layout activeView={currentView} onNavigate={setCurrentView} userEmail={userEmail} onLogout={handleLogout}>
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
