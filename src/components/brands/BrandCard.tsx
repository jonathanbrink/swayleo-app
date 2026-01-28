import { useNavigate } from 'react-router-dom';
import { Globe, Calendar, Check, Pencil, Trash2 } from 'lucide-react';
import type { Brand, BrandKit } from '../../types';

interface BrandCardProps {
  brand: Brand;
  brandKit: BrandKit | null;
  onDelete: (id: string, name: string) => void;
}

export function BrandCard({ brand, brandKit, onDelete }: BrandCardProps) {
  const navigate = useNavigate();
  const isComplete = brandKit?.is_complete ?? false;

  const handleClick = () => {
    navigate(`/brands/${brand.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/brands/${brand.id}/kit`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(brand.id, brand.name);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl border border-slate-100 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sway-100 to-fuchsia-100 flex items-center justify-center">
          <span className="font-display font-bold text-lg text-sway-600">
            {brand.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title="Edit Brand Kit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
            title="Delete Brand"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-lg text-slate-800 mb-1">{brand.name}</h3>

      {brand.website_url && (
        <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-3">
          <Globe className="w-4 h-4" />
          <span className="truncate">
            {brand.website_url.replace(/^https?:\/\//, '')}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            isComplete
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {isComplete ? (
            <>
              <Check className="w-3 h-3" /> Kit Complete
            </>
          ) : (
            'Kit In Progress'
          )}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(brand.updated_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
