
import { Project } from '../types';
// Import date-fns functions from subpaths to fix export member errors
import { differenceInDays } from 'date-fns/differenceInDays';
import { parseISO } from 'date-fns/parseISO';
import { isSameDay } from 'date-fns/isSameDay';
import { startOfDay } from 'date-fns/startOfDay';
import { supabase } from '../supabaseClient';

export const checkAndNotifySlack = async (projects: Project[]) => {
  const today = startOfDay(new Date());
  
  // URL'yi Supabase settings tablosundan çek
  const { data: settingsData, error: settingsError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'slack_webhook_url')
    .single();

  if (settingsError || !settingsData?.value) {
    return { 
      success: false, 
      message: "Slack Webhook URL'si veri tabanında bulunamadı." 
    };
  }

  const SLACK_WEBHOOK_URL = settingsData.value;

  const projectsToNotify = projects.filter(p => {
    const expirationDate = startOfDay(parseISO(p.expiration_date));
    const daysLeft = differenceInDays(expirationDate, today);
    
    const isClose = daysLeft <= 7 && daysLeft >= 0;
    const isUnpaid = p.status !== 'odendi';
    const isWorking = p.status !== 'iptal' && p.status !== 'durduruldu';
    
    // Bugün bildirim gönderildi mi kontrolü
    const lastNotified = p.slack_notified_at ? startOfDay(parseISO(p.slack_notified_at)) : null;
    const sentToday = lastNotified ? isSameDay(lastNotified, today) : false;

    // 1 hafta kaldıysa, ödenmediyse, aktifse VE bugün henüz bildirilmediyse
    return isClose && isUnpaid && isWorking && !sentToday;
  });

  if (projectsToNotify.length === 0) {
    return { success: true, count: 0, message: "Bugün için yeni bildirim yok." };
  }

  let messageText = "⚠️ *HostTracker: Günlük Ödeme Hatırlatıcısı*\n\n";
  projectsToNotify.forEach(p => {
    const daysLeft = differenceInDays(parseISO(p.expiration_date), today);
    messageText += `• *${p.project_name}* (${p.domain})\n   ⏰ ${daysLeft} gün kaldı | Durum: *${p.status.toUpperCase()}* | Ücret: ${p.price || 0} TL\n\n`;
  });

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ text: messageText }),
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors'
    });

    // Başarılıysa veritabanında tarihi güncelle
    const projectIds = projectsToNotify.map(p => p.id);
    await supabase
      .from('projects')
      .update({ slack_notified_at: new Date().toISOString() })
      .in('id', projectIds);

    return { success: true, count: projectsToNotify.length };
  } catch (error) {
    return { success: false, message: "Slack gönderiminde bir hata oluştu." };
  }
};
