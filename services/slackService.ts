import { api } from '../api';

/**
 * Slack bildirimini artık Worker gönderiyor (her gün cron ile de otomatik çalışır).
 * Bu buton sadece kontrolü hemen tetikler.
 */
export const checkAndNotifySlack = async () => {
  try {
    return await api.notifySlack();
  } catch (error: any) {
    return { success: false, count: 0, message: error.message || 'Slack gönderiminde bir hata oluştu.' };
  }
};
