# HostTracker – Hosting & Domain Takip Paneli

Yıllık hosting/domain yenileme tarihlerini takip eden, yaklaşan ödemeleri Slack'e bildiren panel.

**Canlı:** https://takip.bilgigram.com

**Altyapı:** React (Vite) + Cloudflare Worker + Cloudflare D1 (SQLite).
D1, Supabase'in ücretsiz planı gibi kullanılmayınca uyumaz/kapanmaz. Slack hatırlatıcısı da
artık tarayıcıda değil, Worker'da her gün 09:00'da (TR) cron ile otomatik çalışır.

## İlk kurulum (bir kez)

```bash
npm install
npx wrangler login                          # Cloudflare hesabınla giriş
npx wrangler d1 create hosting-tracker      # çıkan database_id'yi wrangler.jsonc'ye yapıştır
npm run db:migrate                          # tabloları oluştur
npx wrangler secret put ADMIN_PASSWORD      # panel şifresi
npx wrangler secret put SESSION_SECRET      # uzun rastgele metin (örn. `openssl rand -hex 32`)
npm run deploy
```

Giriş e-postası `wrangler.jsonc` içindeki `ADMIN_EMAIL` değişkenidir.

## E-posta bildirimi (isteğe bağlı)

1. [resend.com](https://resend.com)'a **bildirim almak istediğin e-posta adresiyle** ücretsiz kaydol.
2. API Keys → Create API Key (Sending access yeterli).
3. `npx wrangler secret put RESEND_API_KEY` ile anahtarı gir.
4. Panelde Ayarlar → E-posta Adresi → "Test E-postası Gönder".

Kendi domainini Resend'de doğrulamadan gönderici `onboarding@resend.dev` olur ve sadece Resend
hesabının e-postasına mail atılabilir. Domain doğrularsan `MAIL_FROM` değişkeniyle göndericiyi değiştir.

## Supabase'den verileri taşıma (bir kez)

1. Supabase projesini son bir kez uyandır (Restore).
2. Supabase → Project Settings → API'den **Project URL** ve **service_role** key'i al.
3. Çalıştır:

```bash
SUPABASE_URL=https://xyz.supabase.co SUPABASE_KEY=<service_role> \
  node scripts/supabase-to-d1.mjs > scripts/import.sql
npx wrangler d1 execute hosting-tracker --remote --file=scripts/import.sql
```

Projeler ve Slack webhook ayarı aktarılır. Ardından Supabase projesini silebilirsin.

## Yerel geliştirme

```bash
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev:api   # Worker + yerel D1 → http://localhost:8787
npm run dev       # Vite → http://localhost:3000 (/api isteklerini 8787'ye yönlendirir)
```
