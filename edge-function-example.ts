
/**
 * Bu kod Supabase Edge Functions klasöründe (functions/kontrol-et/index.ts) yer almalıdır.
 * Deno runtime üzerinde çalışır.
 */

/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { differenceInDays, parseISO } from 'https://esm.sh/date-fns@2.29.3'

const SLACK_WEBHOOK = Deno.env.get('SLACK_WEBHOOK_URL')

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Verileri çek
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .is('slack_notified_at', null)
    .not('status', 'in', '("iptal", "durduruldu")')

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const today = new Date()
  const toNotify = projects.filter(p => {
    const days = differenceInDays(parseISO(p.expiration_date), today)
    return days <= 7 && days >= 0
  })

  if (toNotify.length === 0) {
    return new Response(JSON.stringify({ message: "No projects to notify" }))
  }

  // 2. Slack mesajı hazırla
  let message = "⚠️ *Hosting Süresi Yaklaşan Projeler*\n\n"
  toNotify.forEach(p => {
    const days = differenceInDays(parseISO(p.expiration_date), today)
    message += `• ${p.domain} – ${days} gün – *${p.status.toUpperCase()}*\n`
  })

  // 3. Slack'e gönder
  const slackRes = await fetch(SLACK_WEBHOOK!, {
    method: 'POST',
    body: JSON.stringify({ text: message })
  })

  // 4. DB güncelle
  if (slackRes.ok) {
    const ids = toNotify.map(p => p.id)
    await supabase
      .from('projects')
      .update({ slack_notified_at: new Date().toISOString() })
      .in('id', ids)
  }

  return new Response(JSON.stringify({ notified: toNotify.length }), { status: 200 })
})
*/
