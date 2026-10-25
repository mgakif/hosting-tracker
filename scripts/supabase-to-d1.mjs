/**
 * Supabase'deki verileri D1'e aktarmak için SQL dosyası üretir.
 *
 * Kullanım:
 *   SUPABASE_URL=https://xyz.supabase.co SUPABASE_KEY=<service_role key> \
 *     node scripts/supabase-to-d1.mjs > scripts/import.sql
 *   npx wrangler d1 execute hosting-tracker --remote --file=scripts/import.sql
 *
 * Not: Supabase projesi o an uyanık (açık) olmalı.
 */

const { SUPABASE_URL, SUPABASE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('SUPABASE_URL ve SUPABASE_KEY ortam değişkenlerini verin.');
  process.exit(1);
}

const fetchTable = async (table) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
  return res.json();
};

const sql = (v) =>
  v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;

const insert = (table, rows, columns) =>
  rows.map(
    (row) =>
      `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((c) => sql(row[c])).join(', ')});`,
  );

const projects = await fetchTable('projects');
const settings = await fetchTable('settings');

const lines = [
  ...insert('projects', projects, [
    'id',
    'project_name',
    'domain',
    'hosting_company',
    'expiration_date',
    'status',
    'price',
    'last_paid_amount',
    'slack_notified_at',
    'created_at',
  ]),
  ...insert('settings', settings, ['key', 'value']),
];

console.log(lines.join('\n'));
console.error(`✔ ${projects.length} proje, ${settings.length} ayar dışa aktarıldı.`);
