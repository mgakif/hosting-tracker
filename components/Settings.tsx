import React, { useState, useEffect } from 'react';
import { Bell, Save, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../api';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({ slack_webhook_url: '' });
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((data) => setSettings({ slack_webhook_url: data.slack_webhook_url || '' }))
      .catch((err) => alert('Ayarlar yüklenemedi: ' + err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveSettings(settings);
    } catch (err: any) {
      alert("Slack URL kaydedilirken hata oluştu: " + err.message);
      return;
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const testSlack = async () => {
    if (!settings.slack_webhook_url) return alert('Lütfen önce Slack URL girin.');
    try {
      await api.testSlack(settings.slack_webhook_url);
      alert('Test mesajı gönderildi!');
    } catch (err: any) {
      alert('Slack test hatası: ' + err.message);
    }
  };

  const inputClasses = "w-full px-4 py-2.5 bg-white border border-slate-400 text-slate-900 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all font-mono text-xs disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200";
  const labelClasses = "block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ayarlar</h1>
        <p className="text-slate-500 font-medium">Uygulama bağlantılarını ve bildirim tercihlerini yönetin.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Slack Config */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Slack Bildirimleri</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Her gün 09:00'da otomatik hatırlatıcı</p>
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
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {isSaved ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <Save className="w-5 h-5" />}
          {isSaved ? 'KAYDEDİLDİ' : 'AYARLARI KAYDET'}
        </button>
      </form>
    </div>
  );
};
