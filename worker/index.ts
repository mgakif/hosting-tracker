/**
 * HostTracker Worker
 * - /api/* isteklerini karşılar (D1 veritabanı)
 * - Her gün cron ile Slack hatırlatıcısını kendisi gönderir
 * - Diğer tüm istekler dist/ altındaki React uygulamasına düşer
 */

interface Env {
  DB: D1Database;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
}

const STATUSES = ['odendi', 'iptal', 'durduruldu', 'borc', 'ertelendi'];
const EDITABLE_FIELDS = [
  'project_name',
  'domain',
  'hosting_company',
  'expiration_date',
  'status',
  'price',
  'last_paid_amount',
  'slack_notified_at',
] as const;

const SESSION_COOKIE = 'ht_session';
const SESSION_DAYS = 30;

// ---------- Yardımcılar ----------

const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });

const fail = (message: string, status = 400) => json({ error: message }, status);

const b64url = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const hmac = async (secret: string, data: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
};

// Zamanlama saldırılarına karşı: iki değerin HMAC'ini karşılaştır
const safeEqual = async (secret: string, a: string, b: string) =>
  (await hmac(secret, a)) === (await hmac(secret, b));

const createSession = async (env: Env, email: string) => {
  const payload = b64url(
    new TextEncoder().encode(JSON.stringify({ email, exp: Date.now() + SESSION_DAYS * 86400_000 })),
  );
  return `${payload}.${await hmac(env.SESSION_SECRET, payload)}`;
};

const readSession = async (request: Request, env: Env): Promise<string | null> => {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;

  const [payload, sig] = match[1].split('.');
  if (!payload || !sig || (await hmac(env.SESSION_SECRET, payload)) !== sig) return null;

  try {
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.exp > Date.now() ? decoded.email : null;
  } catch {
    return null;
  }
};

const sessionCookie = (value: string, maxAge: number) =>
  `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

// Türkiye saatine göre bugünün tarihi (YYYY-MM-DD)
const todayTR = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / 86400_000);

const pickFields = (body: Record<string, unknown>) => {
  const data: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }
  if ('status' in data && !STATUSES.includes(String(data.status))) {
    throw new Error('Geçersiz durum değeri.');
  }
  return data;
};

// ---------- Slack ----------

const getSlackUrl = async (env: Env) => {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
    .bind('slack_webhook_url')
    .first<{ value: string | null }>();
  return row?.value || '';
};

const postToSlack = (url: string, text: string) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

/** 7 gün veya daha az kalan, ödenmemiş ve aktif projeler için günde bir bildirim gönderir. */
const notifySlack = async (env: Env) => {
  const slackUrl = await getSlackUrl(env);
  if (!slackUrl) {
    return { success: false, count: 0, message: "Slack Webhook URL'si ayarlanmamış." };
  }

  const today = todayTR();
  const { results } = await env.DB.prepare(
    `SELECT * FROM projects
     WHERE status NOT IN ('odendi', 'iptal', 'durduruldu')
     ORDER BY expiration_date`,
  ).all<Record<string, any>>();

  const toNotify = results.filter((p) => {
    const daysLeft = daysBetween(today, p.expiration_date);
    const sentToday = p.slack_notified_at && todayOf(p.slack_notified_at) === today;
    return daysLeft >= 0 && daysLeft <= 7 && !sentToday;
  });

  if (toNotify.length === 0) {
    return { success: true, count: 0, message: 'Bugün için yeni bildirim yok.' };
  }

  let text = '⚠️ *HostTracker: Günlük Ödeme Hatırlatıcısı*\n\n';
  for (const p of toNotify) {
    const daysLeft = daysBetween(today, p.expiration_date);
    text += `• *${p.project_name}* (${p.domain})\n   ⏰ ${daysLeft} gün kaldı | Durum: *${String(p.status).toUpperCase()}* | Ücret: ${p.price || 0} TL\n\n`;
  }

  const res = await postToSlack(slackUrl, text);
  if (!res.ok) {
    return { success: false, count: 0, message: `Slack hata döndürdü: ${res.status}` };
  }

  const now = new Date().toISOString();
  await env.DB.batch(
    toNotify.map((p) =>
      env.DB.prepare('UPDATE projects SET slack_notified_at = ? WHERE id = ?').bind(now, p.id),
    ),
  );

  return { success: true, count: toNotify.length };
};

/** Bildirim kontrolünü çalıştırır ve sonucunu settings tablosuna kaydeder. */
const runNotify = async (env: Env, source: 'cron' | 'manuel') => {
  let result: { success: boolean; count: number; message?: string };
  try {
    result = await notifySlack(env);
  } catch (err: any) {
    result = { success: false, count: 0, message: err?.message || 'Bilinmeyen hata.' };
  }
  const record = { at: new Date().toISOString(), source, ...result };
  await env.DB.prepare(
    `INSERT INTO settings (key, value) VALUES ('last_notify', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  )
    .bind(JSON.stringify(record))
    .run();
  console.log('Slack bildirim kontrolü:', JSON.stringify(record));
  return result;
};

const todayOf = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date(iso));

// ---------- API ----------

const handleApi = async (request: Request, env: Env, url: URL): Promise<Response> => {
  const { pathname } = url;
  const method = request.method;

  // Giriş
  if (pathname === '/api/login' && method === 'POST') {
    const { email = '', password = '' } = await request.json<any>().catch(() => ({}));
    const ok =
      String(email).trim().toLowerCase() === env.ADMIN_EMAIL.toLowerCase() &&
      (await safeEqual(env.SESSION_SECRET, String(password), env.ADMIN_PASSWORD));
    if (!ok) return fail('E-posta veya şifre hatalı.', 401);

    const token = await createSession(env, env.ADMIN_EMAIL);
    return json({ email: env.ADMIN_EMAIL }, 200, {
      'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400),
    });
  }

  if (pathname === '/api/logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
  }

  // Buradan sonrası oturum ister
  const email = await readSession(request, env);
  if (!email) return fail('Oturum bulunamadı.', 401);

  if (pathname === '/api/me') return json({ email });

  // Projeler
  if (pathname === '/api/projects') {
    if (method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM projects ORDER BY expiration_date ASC',
      ).all();
      return json(results);
    }
    if (method === 'POST') {
      const data = pickFields(await request.json<any>());
      if (!data.project_name || !data.domain || !data.expiration_date) {
        return fail('Proje adı, domain ve bitiş tarihi zorunludur.');
      }
      data.id = crypto.randomUUID();
      const cols = Object.keys(data);
      await env.DB.prepare(
        `INSERT INTO projects (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      )
        .bind(...Object.values(data))
        .run();
      return json({ id: data.id }, 201);
    }
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([\w-]+)$/);
  if (projectMatch) {
    const id = projectMatch[1];
    if (method === 'PUT' || method === 'PATCH') {
      const data = pickFields(await request.json<any>());
      const cols = Object.keys(data);
      if (cols.length === 0) return fail('Güncellenecek alan yok.');
      await env.DB.prepare(`UPDATE projects SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
        .bind(...Object.values(data), id)
        .run();
      return json({ ok: true });
    }
    if (method === 'DELETE') {
      await env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }
  }

  // Ayarlar
  if (pathname === '/api/settings') {
    if (method === 'GET') {
      const last = await env.DB.prepare("SELECT value FROM settings WHERE key = 'last_notify'")
        .first<{ value: string }>();
      return json({
        slack_webhook_url: await getSlackUrl(env),
        last_notify: last ? JSON.parse(last.value) : null,
      });
    }
    if (method === 'PUT') {
      const { slack_webhook_url = '' } = await request.json<any>();
      await env.DB.prepare(
        `INSERT INTO settings (key, value) VALUES ('slack_webhook_url', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
        .bind(String(slack_webhook_url))
        .run();
      return json({ ok: true });
    }
  }

  // Slack
  if (pathname === '/api/slack/test' && method === 'POST') {
    const { url: hookUrl } = await request.json<any>().catch(() => ({}));
    const target = hookUrl || (await getSlackUrl(env));
    if (!target) return fail("Slack Webhook URL'si yok.");
    const res = await postToSlack(target, '🚀 HostTracker bağlantısı başarılı!');
    return res.ok ? json({ ok: true }) : fail(`Slack hata döndürdü: ${res.status}`, 502);
  }

  if (pathname === '/api/slack/notify' && method === 'POST') {
    return json(await runNotify(env, 'manuel'));
  }

  return fail('Bulunamadı.', 404);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }
    try {
      return await handleApi(request, env, url);
    } catch (err: any) {
      return fail(err?.message || 'Sunucu hatası.', 500);
    }
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runNotify(env, 'cron'));
  },
};
