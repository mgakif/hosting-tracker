
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase yapılandırmasını güvenli bir şekilde alır.
 * Tarayıcı ortamında 'process is not defined' hatasını önler.
 */
const getEnvVar = (name: string): string | undefined => {
  // 1. Vite standardı (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[name];
  }
  
  // 2. Node/Legacy standardı (process.env) - Güvenli kontrol
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[name];
    }
  } catch (e) {
    // process erişimi engellenmiş olabilir
  }
  
  return undefined;
};

const getSupabaseConfig = () => {
  const envUrl = getEnvVar('VITE_SUPABASE_URL');
  const envKey = getEnvVar('VITE_API_KEY');

  const savedUrl = localStorage.getItem('supabase_url');
  const savedKey = localStorage.getItem('supabase_anon_key');

  return {
    url: envUrl || savedUrl || '',
    key: envKey || savedKey || '',
    isFromEnv: !!(envUrl && envKey)
  };
};

const config = getSupabaseConfig();

// Geçerli bir URL kontrolü
const isValidUrl = (url: string) => {
  try {
    return url.startsWith('https://');
  } catch {
    return false;
  }
};

const INITIAL_URL = isValidUrl(config.url) ? config.url : 'https://placeholder.supabase.co';
const INITIAL_KEY = config.key || 'placeholder';

// Singleton client instance
export const supabase = createClient(INITIAL_URL, INITIAL_KEY);

export const isSupabaseConfigured = () => {
  const cfg = getSupabaseConfig();
  return isValidUrl(cfg.url) && cfg.key.length > 5;
};

export const isConfiguredByEnv = () => {
  return !!(getEnvVar('VITE_SUPABASE_URL') && getEnvVar('VITE_API_KEY'));
};
