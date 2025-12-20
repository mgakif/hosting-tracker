
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { 
  Calendar, 
  ExternalLink, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  RefreshCcw, 
  DollarSign 
} from 'lucide-react';
import { format } from 'date-fns/format';
import { differenceInDays } from 'date-fns/differenceInDays';
import { addYears } from 'date-fns/addYears';
import { parseISO } from 'date-fns/parseISO';
import { startOfDay } from 'date-fns/startOfDay';
import { tr } from 'date-fns/locale/tr';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import * as LucideIcons from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onChanged: () => void;
}

const statusConfig: Record<ProjectStatus, { label: string; color: string; icon: any }> = {
  odendi: { label: 'ÖDENDİ', color: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20', icon: LucideIcons.ShieldCheck },
  borc: { label: 'BORÇ', color: 'bg-rose-100 text-rose-700 ring-rose-600/20', icon: LucideIcons.AlertCircle },
  iptal: { label: 'İPTAL', color: 'bg-slate-100 text-slate-700 ring-slate-600/20', icon: LucideIcons.Clock },
  durduruldu: { label: 'DURDURULDU', color: 'bg-amber-100 text-amber-700 ring-amber-600/20', icon: LucideIcons.Clock },
  ertelendi: { label: 'ERTELENDİ', color: 'bg-indigo-100 text-indigo-700 ring-indigo-600/20', icon: LucideIcons.Clock },
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onChanged }) => {
  const [renewing, setRenewing] = useState(false);
  
  const expirationDate = startOfDay(parseISO(project.expiration_date));
  const today = startOfDay(new Date());
  const daysLeft = differenceInDays(expirationDate, today);
  
  const StatusIcon = statusConfig[project.status]?.icon || LucideIcons.Clock;

  const handleDelete = async () => {
    if (!isSupabaseConfigured()) {
      alert("Lütfen önce Ayarlar sayfasından Supabase bağlantısını kurun.");
      return;
    }

    if (confirm(`"${project.project_name}" projesini silmek istediğinize emin misiniz?`)) {
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) {
        alert('Silme hatası: ' + error.message);
      } else {
        onChanged();
      }
    }
  };

  const handleRenew = async () => {
    if (!isSupabaseConfigured()) {
      alert("Bağlantı ayarları eksik. Lütfen Ayarlar sayfasına gidin.");
      return;
    }

    const nextYearDate = addYears(expirationDate, 1);
    const confirmText = `${project.project_name} projesini +1 yıl uzatmak istiyor musunuz?\n\n` +
                        `Yeni Bitiş: ${format(nextYearDate, 'dd MMMM yyyy', { locale: tr })}\n` +
                        `Ödeme: ${project.price || 0} TL`;

    if (confirm(confirmText)) {
      setRenewing(true);
      try {
        const newExpirationStr = format(nextYearDate, 'yyyy-MM-dd');
        const { error } = await supabase
          .from('projects')
          .update({
            expiration_date: newExpirationStr,
            status: 'odendi' as ProjectStatus,
            last_paid_amount: project.price || 0,
            slack_notified_at: null
          })
          .eq('id', project.id);

        if (error) throw error;
        onChanged();
      } catch (err: any) {
        alert('İşlem başarısız: ' + (err.message || 'Veri tabanı hatası.'));
      } finally {
        setRenewing(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full relative overflow-hidden group">
      {daysLeft < 7 && project.status !== 'iptal' && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-slate-900 truncate pr-2 tracking-tight">
            {project.project_name}
          </h3>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5 font-medium">
            <span className="truncate">{project.domain}</span>
            <a href={`http://${project.domain}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
              <LucideIcons.ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-md text-[10px] font-black ring-1 flex items-center gap-1 shrink-0 ${statusConfig[project.status]?.color || 'bg-slate-100'}`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig[project.status]?.label || 'DURUM BELİRSİZ'}
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2 text-slate-400">
            <LucideIcons.Calendar className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest">Yenileme Tarihi</span>
          </div>
          <span className="text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
            {format(expirationDate, 'dd MMMM yyyy', { locale: tr })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-2xl border ${daysLeft < 7 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
            <span className={`text-[10px] font-black uppercase tracking-tighter block mb-1 ${daysLeft < 7 ? 'text-rose-600' : 'text-slate-400'}`}>
              Kalan Süre
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black leading-none ${daysLeft < 7 ? 'text-rose-600' : 'text-slate-900'}`}>
                {daysLeft}
              </span>
              <span className="text-[10px] font-black text-slate-400">GÜN</span>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter block mb-1">Yıllık Ücret</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-blue-700 leading-none">
                {project.price !== null ? project.price : '-'}
              </span>
              <span className="text-[10px] font-black text-blue-400">TL</span>
            </div>
          </div>
        </div>

        {project.last_paid_amount !== null && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black border border-emerald-100 uppercase tracking-wider">
            <LucideIcons.DollarSign className="w-3 h-3" />
            Son Ödenen: {project.last_paid_amount} TL
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
          <div className={`w-1.5 h-1.5 rounded-full ${project.hosting_company ? 'bg-blue-400' : 'bg-slate-300'}`} />
          {project.hosting_company || 'Sağlayıcı Yok'}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <button 
          onClick={handleRenew}
          disabled={renewing}
          className="w-full flex items-center justify-center gap-2 py-3 text-xs font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
        >
          <LucideIcons.RefreshCcw className={`w-3.5 h-3.5 ${renewing ? 'animate-spin' : ''}`} />
          ÖDEME AL VE +1 YIL YENİLE
        </button>
        
        <div className="flex gap-2">
          <button 
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <LucideIcons.Edit2 className="w-3.5 h-3.5" />
            Düzenle
          </button>
          <button 
            onClick={handleDelete}
            className="flex items-center justify-center w-11 h-11 text-rose-500 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <LucideIcons.Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
