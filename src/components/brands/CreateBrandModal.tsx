import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Select, Button, useToast } from '../ui';
import { useCreateBrand } from '../../hooks';
import { VERTICAL_OPTIONS } from '../../types';

interface CreateBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBrandModal({ isOpen, onClose }: CreateBrandModalProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createBrand = useCreateBrand();

  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [vertical, setVertical] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Brand name is required';
    }

    if (websiteUrl && !validateUrl(websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const brand = await createBrand.mutateAsync({
        name: name.trim(),
        website_url: websiteUrl.trim() || null,
        vertical: vertical || null,
      });

      showToast(`"${brand.name}" created successfully`);
      handleClose();
      navigate(`/brands/${brand.id}/kit`);
    } catch (error) {
      showToast('Failed to create brand', 'error');
      console.error('Error creating brand:', error);
    }
  };

  const handleClose = () => {
    onClose();
    setName('');
    setWebsiteUrl('');
    setVertical('');
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Brand">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Brand Name"
          placeholder="e.g., Acme Co"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((prev) => ({ ...prev, name: '' }));
          }}
          required
          error={errors.name}
        />

        <Input
          label="Website URL"
          type="url"
          placeholder="https://example.com"
          value={websiteUrl}
          onChange={(e) => {
            setWebsiteUrl(e.target.value);
            setErrors((prev) => ({ ...prev, websiteUrl: '' }));
          }}
          error={errors.websiteUrl}
        />

        <Select
          label="Vertical"
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
          options={VERTICAL_OPTIONS}
          placeholder="Select a vertical (optional)"
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createBrand.isPending}
            className="flex-1"
          >
            Create & Build Kit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
