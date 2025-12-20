
import { Project } from '../types';
// Fixed date-fns imports by using subpaths for better reliability
import { differenceInDays } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { supabase } from '../supabaseClient';

export const checkAndNotifySlack = async (projects: Project[]) => {
  const today = new Date();
  
  // Get URL from local storage
  const SLACK_WEBHOOK_URL = localStorage.getItem('slack_webhook_url');

  if (!SLACK_WEBHOOK_URL) {
    return { 
      success: false, 
      message: "Slack Webhook URL ayarlanmamış. Lütfen Ayarlar sayfasından yapılandırın." 
    };
  }

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
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ text: messageText }),
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors' // Allow simple POST to webhook
    });

    // Update notified timestamp in DB
    const projectIds = projectsToNotify.map(p => p.id);
    const { error } = await supabase
      .from('projects')
      .update({ slack_notified_at: new Date().toISOString() })
      .in('id', projectIds);

    if (error) console.error("Error updating notify timestamp:", error);

    return { success: true, count: projectsToNotify.length };
  } catch (error) {
    console.error("Slack send error:", error);
    return { success: false, message: "Slack bildirim hatası. URL'yi kontrol edin." };
  }
};
