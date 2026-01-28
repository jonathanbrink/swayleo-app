import { useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { useMoodboardAssets, useUploadMoodboardAsset, useDeleteMoodboardAsset } from '../../hooks';
import { useToast } from '../ui';

interface MoodboardUploaderProps {
  brandId: string;
}

export function MoodboardUploader({ brandId }: MoodboardUploaderProps) {
  const { showToast } = useToast();
  const { data: assets = [], isLoading } = useMoodboardAssets(brandId);
  const uploadAsset = useUploadMoodboardAsset();
  const deleteAsset = useDeleteMoodboardAsset();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      // Validate file types
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const validFiles = files.filter((file) => validTypes.includes(file.type));

      if (validFiles.length !== files.length) {
        showToast('Some files were skipped. Only images are allowed.', 'error');
      }

      // Upload files
      for (const file of validFiles) {
        try {
          await uploadAsset.mutateAsync({ brandId, file });
        } catch (error) {
          console.error('Upload error:', error);
          showToast(`Failed to upload ${file.name}`, 'error');
        }
      }

      if (validFiles.length > 0) {
        showToast(`${validFiles.length} image(s) uploaded`);
      }

      // Reset input
      e.target.value = '';
    },
    [brandId, uploadAsset, showToast]
  );

  const handleDelete = useCallback(
    async (assetId: string) => {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return;

      try {
        await deleteAsset.mutateAsync(asset);
        showToast('Image removed');
      } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to remove image', 'error');
      }
    },
    [assets, deleteAsset, showToast]
  );

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-3">
        Moodboard Images
      </label>

      {/* Upload Area */}
      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-sway-300 transition-all duration-200">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3 text-slate-400">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-600 font-medium">Click to upload images</p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF, WEBP up to 10MB</p>
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploadAsset.isPending}
        />
      </label>

      {/* Loading State */}
      {uploadAsset.isPending && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 border-2 border-sway-500 border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      )}

      {/* Image Grid */}
      {!isLoading && assets.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mt-4">
          {assets.map((asset) => (
            <div key={asset.id} className="relative group">
              {asset.url ? (
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-slate-400">Loading...</span>
                </div>
              )}
              <button
                onClick={() => handleDelete(asset.id)}
                disabled={deleteAsset.isPending}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-xs text-slate-400 mt-1 truncate">{asset.filename}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && assets.length === 0 && (
        <p className="mt-4 text-sm text-slate-400 text-center">
          No images uploaded yet
        </p>
      )}
    </div>
  );
}
