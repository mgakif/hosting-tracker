import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toBlob } from 'html-to-image';
import { X, Download, Share2, Calendar, Globe, Server, Loader2 } from 'lucide-react';
import { format } from 'date-fns/format';
import { differenceInDays } from 'date-fns/differenceInDays';
import { parseISO } from 'date-fns/parseISO';
import { startOfDay } from 'date-fns/startOfDay';
import { tr } from 'date-fns/locale/tr';
import { Project } from '../types';

interface CustomerCardProps {
  project: Project;
  onClose: () => void;
}

// "https://www.site.com/" -> "www.site.com"
const cleanDomain = (domain: string) => domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

const slugify = (text: string) =>
  text
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Müşteriye ekran görüntüsü / resim olarak gönderilecek tek projelik hatırlatma kartı. */
export const CustomerCard: React.FC<CustomerCardProps> = ({ project, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const expirationDate = startOfDay(parseISO(project.expiration_date));
  const daysLeft = differenceInDays(expirationDate, startOfDay(new Date()));
  const urgent = daysLeft <= 7;
  const fileName = `${slugify(project.project_name) || 'hosting'}-yenileme.png`;

  const remaining =
    daysLeft > 0 ? `${daysLeft} gün kaldı` : daysLeft === 0 ? 'Bugün sona eriyor' : `${-daysLeft} gün önce sona erdi`;

  const renderImage = async () => {
    if (!cardRef.current) return null;
    // İndirilen resim düz köşeli olsun (ekranda kart yuvarlak kalır)
    return toBlob(cardRef.current, { pixelRatio: 2, cacheBust: true, style: { borderRadius: '0', margin: '0' } });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const blob = await renderImage();
      if (!blob) throw new Error('Resim oluşturulamadı.');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Resim indirilemedi: ' + (err.message || err));
    } finally {
      setBusy(false);
    }
  };

  // Telefonda doğrudan WhatsApp vb. ile paylaşım
  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator;
  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await renderImage();
      if (!blob) throw new Error('Resim oluşturulamadı.');
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${project.project_name} – Hosting Yenileme` });
      } else {
        await handleDownload();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') alert('Paylaşılamadı: ' + (err.message || err));
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm space-y-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end">
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white" aria-label="Kapat">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Resme dönüştürülen alan */}
        <div ref={cardRef} className="bg-white rounded-3xl overflow-hidden shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className={`px-6 pt-6 pb-5 text-white ${urgent ? 'bg-rose-600' : 'bg-blue-600'}`}>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-80">Hosting Yenileme Hatırlatması</p>
            <h2 className="text-2xl font-black tracking-tight mt-1 leading-tight">{project.project_name.trim()}</h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-slate-700">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-bold break-all">{cleanDomain(project.domain)}</span>
            </div>
            {project.hosting_company && (
              <div className="flex items-center gap-3 text-slate-700">
                <Server className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">{project.hosting_company}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium">
                Bitiş: <b>{format(expirationDate, 'dd MMMM yyyy', { locale: tr })}</b>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className={`p-4 rounded-2xl border ${urgent ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${urgent ? 'text-rose-500' : 'text-slate-400'}`}>
                  Kalan Süre
                </span>
                <span className={`text-base font-black leading-tight ${urgent ? 'text-rose-600' : 'text-slate-900'}`}>{remaining}</span>
              </div>
              <div className="p-4 rounded-2xl border bg-blue-50 border-blue-100">
                <span className="text-[10px] font-black uppercase tracking-wider block mb-1 text-blue-400">Yıllık Ücret</span>
                <span className="text-xl font-black text-blue-700 leading-tight">
                  {project.price ? `${project.price.toLocaleString('tr-TR')} TL` : '-'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {daysLeft < 0
                ? 'Hizmetin kesintiye uğramaması için yenileme ödemesinin en kısa sürede yapılması gerekmektedir.'
                : 'Sitenizin kesintisiz çalışmaya devam etmesi için yenileme ödemesinin bitiş tarihinden önce yapılması gerekmektedir.'}
            </p>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] font-bold text-slate-400 tracking-wider text-center">
            takip.bilgigram.com
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black text-slate-900 bg-white rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Resim İndir
          </button>
          {canShare && (
            <button
              onClick={handleShare}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              Paylaş
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
