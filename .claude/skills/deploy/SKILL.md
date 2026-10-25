---
name: deploy
description: HostTracker'ı Cloudflare Workers'a yayınlar, gizli değerleri günceller, D1 veritabanında sorgu/migration çalıştırır ve canlı siteyi doğrular. "deploy et", "yayına al", "canlıya çık", "secret güncelle", "migration çalıştır" isteklerinde kullan.
---

# HostTracker – Cloudflare deploy

Canlı adres: https://takip.bilgigram.com
Worker adı: `hosting-tracker` · D1: `hosting-tracker` (`0bd8dd91-1f10-4592-8e14-6a9539da1506`)

## Kimlik doğrulama

Wrangler token'ı `CLOUDFLARE_API_TOKEN` ortam değişkeninden okur ("Edit Cloudflare Workers" şablonu).
Token'ı asla repoya, commit'e veya bu dosyaya yazma. Değişken yoksa kullanıcıdan bunu cloud
environment ayarlarında (Edit → environment variables / secrets) `CLOUDFLARE_API_TOKEN` adıyla
tanımlamasını iste; yeni oturumda geçerli olur.

```bash
npx wrangler whoami   # token ve hesabı doğrula
```

## Yayınlama

```bash
npm install
npm run typecheck
npm run deploy        # vite build + wrangler deploy (assets + cron trigger)
```

## Veritabanı

Yeni şema değişikliği için `migrations/000N_aciklama.sql` ekle, sonra:

```bash
npm run db:migrate    # = wrangler d1 migrations apply hosting-tracker --remote
npx wrangler d1 execute hosting-tracker --remote --command "SELECT COUNT(*) FROM projects"
```

## Gizli değerler

`ADMIN_PASSWORD`, `SESSION_SECRET`, `RESEND_API_KEY` (isteğe bağlı: `MAIL_FROM` değişkeni).

```bash
echo -n "<değer>" | npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret list
```

`SESSION_SECRET` değişirse tüm oturumlar düşer (yeniden giriş gerekir).

## Doğrulama (deploy sonrası)

1. `curl -s -o /dev/null -w "%{http_code}" https://takip.bilgigram.com/` → 200
2. `curl -s https://takip.bilgigram.com/api/me` → 401 `Oturum bulunamadı.` (API ayakta)
3. Cron logları: `npx wrangler tail` ya da Cloudflare paneli → Workers → hosting-tracker → Logs.
   Son bildirim çalışmasının sonucu D1'de `settings.last_notify` satırında:
   `npx wrangler d1 execute hosting-tracker --remote --command "SELECT value FROM settings WHERE key='last_notify'"`
