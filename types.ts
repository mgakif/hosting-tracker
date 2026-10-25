
export type ProjectStatus = 'odendi' | 'iptal' | 'durduruldu' | 'borc' | 'ertelendi';

export interface Project {
  id: string;
  project_name: string;
  domain: string;
  hosting_company: string;
  expiration_date: string;
  status: ProjectStatus;
  price: number | null;
  last_paid_amount: number | null;
  slack_notified_at: string | null;
  created_at: string;
}

export type ProjectFilter = 'all' | '7days' | '30days' | 'borc';

export interface LastNotify {
  at: string;
  source: 'cron' | 'manuel';
  success: boolean;
  count: number;
  message?: string;
}
