import { useState, useMemo } from 'react';
import { Plus, Search, Tag } from 'lucide-react';
import { Button, useToast } from '../components/ui';
import { BrandCard, CreateBrandModal } from '../components/brands';
import { useBrands, useDeleteBrand } from '../hooks';
import { supabase } from '../lib/supabase';
import type { BrandKit } from '../types';

export function BrandsList() {
  const { showToast } = useToast();
  const { data: brands = [], isLoading } = useBrands();
  const deleteBrand = useDeleteBrand();
  
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [brandKits, setBrandKits] = useState<Record<string, BrandKit>>({});

  // Fetch brand kits for all brands
  useMemo(() => {
    const fetchKits = async () => {
      if (brands.length === 0) return;
      
      const { data } = await supabase
        .from('brand_kits')
        .select('*')
        .in('brand_id', brands.map(b => b.id));
      
      if (data) {
        const kitsMap: Record<string, BrandKit> = {};
        data.forEach(kit => {
          kitsMap[kit.brand_id] = kit;
        });
        setBrandKits(kitsMap);
      }
    };
    
    fetchKits();
  }, [brands]);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [brands, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteBrand.mutateAsync(id);
      showToast(`"${name}" has been deleted`);
    } catch (error) {
      showToast('Failed to delete brand', 'error');
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-semibold text-2xl text-slate-800">Brands</h1>
            <p className="text-slate-500 mt-1">Manage your client brands and their kits</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5" />
            Create Brand
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : brands.length > 0 ? (
          <>
            {/* Search */}
            <div className="relative mb-6 max-w-md">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-sway-500 focus:ring-2 focus:ring-sway-500/20"
              />
            </div>

            {/* Brands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBrands.map((brand) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  brandKit={brandKits[brand.id] || null}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {filteredBrands.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No brands matching "{search}"</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100">
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <Tag className="w-8 h-8" />
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-800 mb-2">
                No brands yet
              </h3>
              <p className="text-slate-500 text-center max-w-sm mb-6">
                Create your first brand to get started building Brand Kits for
                AI-powered copywriting.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-5 h-5" />
                Create Your First Brand
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Create Brand Modal */}
      <CreateBrandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
