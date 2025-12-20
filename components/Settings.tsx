
import React, { useState, useEffect } from 'react';
import { Bell, Save, ShieldCheck, HelpCircle, Database, AlertTriangle, RefreshCcw, Lock } from 'lucide-react';
import { isConfiguredByEnv } from '../supabaseClient';

export const Settings: React.FC = () => {
  const isEnvActive = isConfiguredByEnv();
  
  const [settings, setSettings] = useState({
    slack_webhook_url: '',
    supabase_url: '',
    supabase_anon_key: ''
  });
  const [isSaved, setIsSaved] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);

  useEffect(() => {
    setSettings({
      slack_webhook_url: localStorage.getItem('slack_webhook_url') || '',
      supabase_url: process.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '',
      supabase_anon_key: process.env.VITE_API_KEY || localStorage.getItem('supabase_anon_key') || ''
    });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if critical DB settings changed
    const oldUrl = localStorage.getItem('supabase_url');
    const oldKey = localStorage.getItem('supabase_anon_key');
    const dbChanged = oldUrl !== settings.supabase_url || oldKey !== settings.supabase_anon_key;

    localStorage.setItem('slack_webhook_url', settings.slack_webhook_url);
    
    // Sadece env aktif değilse manuel değerleri kaydet
    if (!isEnvActive) {
      localStorage.setItem('supabase_url', settings.supabase_url);
      localStorage.setItem('supabase_anon_key', settings.supabase_anon_key);
    }
    
    setIsSaved(true);
    if (dbChanged && !isEnvActive) setNeedsReload(true);
    
    setTimeout(() => setIsSaved(false), 3000);
  };

  const testSlack = async () => {
    if (!settings.slack_webhook_url) return alert('Lütfen önce Slack URL girin.');
    try {
      await fetch(settings.slack_webhook_url, {
        method: 'POST',
        body: JSON.stringify({ text: '🚀 HostTracker bağlantısı başarılı!' }),
        mode: 'no-cors'
      });
      alert('Test mesajı gönderildi!');
    } catch (e) {
      alert('Slack test hatası.');
    }
  };

  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-400 text-slate-900 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-mono text-xs disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200";
  const labelClasses = "block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ayarlar</h1>
        <p className="text-slate-500 font-medium">Uygulama bağlantılarını ve bildirim tercihlerini yönetin.</p>
      </div>

      {isEnvActive && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold uppercase tracking-tight">
            Sistem üretim modunda (Production). Supabase bağlantı bilgileri ortam değişkenlerinden (Environment Variables) güvenli bir şekilde alınıyor.
          </p>
        </div>
      )}

      {needsReload && !isEnvActive && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-bold">Veri tabanı ayarları değişti. Uygulanması için yenileyin.</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black hover:bg-amber-700 transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            ŞİMDİ YENİLE
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Supabase Config */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900">Supabase Bağlantısı</h2>
                {isEnvActive && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Veri Depolama (PostgreSQL)</p>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div>
              <label className={labelClasses}>Project URL</label>
              <input 
                type="text"
                disabled={isEnvActive}
                value={settings.supabase_url}
                onChange={(e) => setSettings({...settings, supabase_url: e.target.value})}
                placeholder="https://xyz.supabase.co"
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Anon Key / API Key</label>
              <input 
                type="password"
                disabled={isEnvActive}
                value={settings.supabase_anon_key}
                onChange={(e) => setSettings({...settings, supabase_anon_key: e.target.value})}
                placeholder="Environment üzerinden yüklendi"
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        {/* Slack Config */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Slack Bildirimleri</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Otomatik Hatırlatıcı</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelClasses}>Webhook URL</label>
                <button 
                  type="button" 
                  onClick={testSlack}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase"
                >
                  Bağlantıyı Test Et
                </button>
              </div>
              <input 
                type="text"
                value={settings.slack_webhook_url}
                onChange={(e) => setSettings({...settings, slack_webhook_url: e.target.value})}
                placeholder="https://hooks.slack.com/services/..."
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3"
        >
          {isSaved ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <Save className="w-5 h-5" />}
          {isSaved ? 'DEĞİŞİKLİKLER KAYDEDİLDİ' : 'AYARLARI KAYDET'}
        </button>
      </form>
    </div>
  );
};
