
import React, { useState, useMemo } from 'react';
import { Project, ProjectFilter } from '../types';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { Filter, Plus, Bell, RefreshCw, Info } from 'lucide-react';
// Fix: Using direct subpath imports for date-fns to resolve export member errors
import { differenceInDays } from 'date-fns/differenceInDays';
import { parseISO } from 'date-fns/parseISO';
import { startOfDay } from 'date-fns/startOfDay';
import { checkAndNotifySlack } from '../services/slackService';

interface DashboardProps {
  projects: Project[];
  onRefresh: () => void;
  loading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, onRefresh, loading }) => {
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [slackSending, setSlackSending] = useState(false);

  const filteredProjects = useMemo(() => {
    const today = startOfDay(new Date());
    return projects.filter(p => {
      const expDate = startOfDay(parseISO(p.expiration_date));
      const daysLeft = differenceInDays(expDate, today);
      
      if (filter === '7days') return daysLeft <= 7 && p.status !== 'iptal' && p.status !== 'durduruldu';
      if (filter === '30days') return daysLeft <= 30 && p.status !== 'iptal' && p.status !== 'durduruldu';
      if (filter === 'borc') return p.status === 'borc';
      return true;
    });
  }, [projects, filter]);

  const handleSlackCheck = async () => {
    setSlackSending(true);
    const result = await checkAndNotifySlack(projects);
    if (result.success) {
      alert(`${result.count} proje için Slack bildirimi gönderildi!`);
      onRefresh();
    } else {
      alert(result.message || "Bildirim gönderilemedi. Slack Webhook ayarını kontrol edin.");
    }
    setSlackSending(false);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProject(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Proje Yönetimi</h1>
          <p className="text-slate-500 text-sm font-medium">Müşterilerinizin hosting ve domain sürelerini buradan takip edin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleSlackCheck}
            disabled={slackSending}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            {slackSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Slack'i Kontrol Et
          </button>
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-5 h-5" />
            Yeni Proje Ekle
          </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest pl-3">
          <Filter className="w-3.5 h-3.5" />
          Filtrele:
        </div>
        <div className="flex flex-wrap gap-1.5 p-1">
          {(['all', '7days', '30days', 'borc'] as ProjectFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filter === f 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {f === 'all' && 'TÜMÜ'}
              {f === '7days' && '7 GÜN'}
              {f === '30days' && '30 GÜN'}
              {f === 'borc' && 'BORÇLAR'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onEdit={() => handleEdit(project)} 
              onChanged={onRefresh}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <Info className="w-12 h-12 text-slate-200 mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Gösterilecek proje bulunamadı.</p>
          <button onClick={handleAdd} className="mt-4 text-blue-600 text-xs font-black hover:underline uppercase">Yeni Proje Ekle</button>
        </div>
      )}

      {isFormOpen && (
        <ProjectForm 
          project={editingProject} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => {
            setIsFormOpen(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
