
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { X, DollarSign } from 'lucide-react';
import { api } from '../api';

interface ProjectFormProps {
  project?: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_name: project?.project_name || '',
    domain: project?.domain || '',
    hosting_company: project?.hosting_company || '',
    expiration_date: project?.expiration_date || '',
    status: project?.status || 'borc' as ProjectStatus,
    price: project?.price || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (project) {
        await api.updateProject(project.id, formData);
      } else {
        await api.createProject(formData);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Form submit error:', err);
      alert('İşlem sırasında bir hata oluştu: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-2 bg-white border border-slate-400 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {project ? 'Projeyi Düzenle' : 'Yeni Proje Ekle'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Proje Adı</label>
            <input
              required
              type="text"
              value={formData.project_name}
              onChange={(e) => setFormData({...formData, project_name: e.target.value})}
              className={inputClasses}
              placeholder="Örn: E-Ticaret Portalı"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Domain Adresi</label>
              <input
                required
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                className={inputClasses}
                placeholder="siteadi.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                Yıllık Ücret
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                className={inputClasses}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Hosting Şirketi</label>
              <input
                type="text"
                value={formData.hosting_company}
                onChange={(e) => setFormData({...formData, hosting_company: e.target.value})}
                className={inputClasses}
                placeholder="Natro, Hetzner..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Bitiş Tarihi</label>
              <input
                required
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Durum</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as ProjectStatus})}
              className={inputClasses}
            >
              <option value="odendi">Ödendi</option>
              <option value="borc">Borç</option>
              <option value="iptal">İptal Edildi</option>
              <option value="durduruldu">Durduruldu</option>
              <option value="ertelendi">Ertelendi</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
