
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase yapılandırmasını alır.
 * Öncelik Sırası:
 * 1. Environment Variables (VITE_SUPABASE_URL, VITE_API_KEY)
 * 2. LocalStorage (Kullanıcı Ayarları)
 */
const getSupabaseConfig = () => {
  // Environment variables (Production için)
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_API_KEY;

  // Local storage (Local development / Fallback için)
  const savedUrl = localStorage.getItem('supabase_url');
  const savedKey = localStorage.getItem('supabase_anon_key');

  return {
    url: envUrl || savedUrl || '',
    key: envKey || savedKey || '',
    isFromEnv: !!(envUrl && envKey)
  };
};

const config = getSupabaseConfig();

// Create the client
// Eğer hiçbir değer yoksa uygulamanın çökmemesi için placeholder kullanılır
const INITIAL_URL = config.url || 'https://placeholder.supabase.co';
const INITIAL_KEY = config.key || 'placeholder';

export const supabase = createClient(INITIAL_URL, INITIAL_KEY);

/**
 * Yapılandırma durumunu kontrol eder
 */
export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return (
    url.length > 0 && 
    key.length > 0 && 
    url !== 'https://placeholder.supabase.co'
  );
};

/**
 * Yapılandırmanın environment'tan mı yoksa kullanıcı ayarlarından mı geldiğini döner
 */
export const isConfiguredByEnv = () => {
  return !!(process.env.VITE_SUPABASE_URL && process.env.VITE_API_KEY);
};
