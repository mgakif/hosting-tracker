
import { Project } from '../types';
import { differenceInDays } from 'date-fns/differenceInDays';
import { parseISO } from 'date-fns/parseISO';
import { supabase } from '../supabaseClient';

export const checkAndNotifySlack = async (projects: Project[]) => {
  const today = new Date();
  
  // URL'yi Supabase settings tablosundan çek
  const { data: settingsData, error: settingsError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'slack_webhook_url')
    .single();

  if (settingsError || !settingsData?.value) {
    return { 
      success: false, 
      message: "Slack Webhook URL'si veri tabanında bulunamadı. Lütfen Ayarlar sayfasından yapılandırın." 
    };
  }

  const SLACK_WEBHOOK_URL = settingsData.value;

  const projectsToNotify = projects.filter(p => {
    const daysLeft = differenceInDays(parseISO(p.expiration_date), today);
    const isClose = daysLeft <= 7 && daysLeft >= 0;
    const isActive = p.status !== 'iptal' && p.status !== 'durduruldu';
    const notNotifiedYet = !p.slack_notified_at;
    return isClose && isActive && notNotifiedYet;
  });

  if (projectsToNotify.length === 0) {
    return { success: true, count: 0, message: "Bildirim gönderilecek yeni proje yok." };
  }

  let messageText = "⚠️ *Hosting Süresi Yaklaşan Projeler*\n\n";
  projectsToNotify.forEach(p => {
    const daysLeft = differenceInDays(parseISO(p.expiration_date), today);
    messageText += `• ${p.domain} – ${daysLeft} gün – *${p.status.toUpperCase()}*\n`;
  });

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ text: messageText }),
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors'
    });

    const projectIds = projectsToNotify.map(p => p.id);
    await supabase
      .from('projects')
      .update({ slack_notified_at: new Date().toISOString() })
      .in('id', projectIds);

    return { success: true, count: projectsToNotify.length };
  } catch (error) {
    return { success: false, message: "Slack bildirim hatası." };
  }
};
