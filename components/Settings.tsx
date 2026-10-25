import React, { useState, useEffect } from 'react';
import { Bell, Save, ShieldCheck, Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { api } from '../api';
import { LastNotify } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({ slack_webhook_url: '', notify_email: '' });
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [lastNotify, setLastNotify] = useState<LastNotify | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((data) => {
        setSettings({ slack_webhook_url: data.slack_webhook_url || '', notify_email: data.notify_email || '' });
        setEmailEnabled(data.email_enabled);
        setLastNotify(data.last_notify);
      })
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

  const testEmail = async () => {
    if (!settings.notify_email) return alert('Lütfen önce e-posta adresi girin.');
    try {
      await api.testEmail(settings.notify_email);
      alert('Test e-postası gönderildi! Gelen kutunu (ve spam klasörünü) kontrol et.');
    } catch (err: any) {
      alert('E-posta test hatası: ' + err.message);
    }
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
              <h2 className="font-bold text-slate-900">Bildirimler</h2>
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

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={`${labelClasses} flex items-center gap-1.5`}>
                  <Mail className="w-3.5 h-3.5" /> E-posta Adresi
                </label>
                {emailEnabled && (
                  <button
                    type="button"
                    onClick={testEmail}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase"
                  >
                    Test E-postası Gönder
                  </button>
                )}
              </div>
              <input
                type="email"
                disabled={!emailEnabled}
                value={settings.notify_email}
                onChange={(e) => setSettings({...settings, notify_email: e.target.value})}
                placeholder="ornek@gmail.com"
                className={inputClasses}
              />
              {!emailEnabled && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  E-posta için Cloudflare'de <code className="font-mono">RESEND_API_KEY</code> gizli değerini tanımlayın.
                </p>
              )}
            </div>

            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              !lastNotify ? 'bg-slate-50 border-slate-200 text-slate-600'
              : lastNotify.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {lastNotify && !lastNotify.success
                ? <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Son Bildirim Kontrolü</p>
                {lastNotify ? (
                  <p className="text-xs font-medium mt-1">
                    {new Date(lastNotify.at).toLocaleString('tr-TR')} ({lastNotify.source === 'cron' ? 'otomatik' : 'manuel'}) –{' '}
                    {lastNotify.success
                      ? (lastNotify.count > 0 ? `${lastNotify.count} proje bildirildi` : (lastNotify.message || 'Bildirilecek proje yok'))
                      : `Hata: ${lastNotify.message}`}
                  </p>
                ) : (
                  <p className="text-xs font-medium mt-1">Henüz çalışmadı. İlk otomatik kontrol her gün 09:00'da.</p>
                )}
              </div>
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
