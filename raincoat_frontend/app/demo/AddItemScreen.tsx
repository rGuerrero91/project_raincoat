'use client';

import { useRef } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Shirt, Camera } from 'lucide-react';

interface AddItemScreenProps {
  onNext: (file: File) => void;
}

export default function AddItemScreen({ onNext }: AddItemScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onNext(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Container className="flex items-center justify-center min-h-screen py-8">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Empty State Illustration */}
        <div className="flex justify-center mb-8">
          <Shirt className="w-24 h-24 text-primary" strokeWidth={1.5} />
        </div>

        {/* Headline */}
        <h2 className="text-headline font-bold mb-4">
          Add your first <strong className="text-primary">item</strong>
        </h2>

        {/* Subheading */}
        <p className="text-lg text-neutral-medium mb-3 leading-relaxed max-w-xl mx-auto">
          Add a photo of a clothing item. It can be the item by itself or a selfie.
        </p>

        <div className="badge mb-10">
          Photos don't get uploaded anywhere
        </div>

        {/* Upload Area */}
        <div
          onClick={handleUploadClick}
          className="border-2 border-dashed border-neutral-medium/30 rounded-4xl p-16 mb-8 cursor-pointer transition-all duration-300 hover:border-primary hover:bg-primary-light/30 hover:shadow-soft group"
        >
          <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Camera className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-xl font-semibold text-ink mb-2">
            Upload Photo
          </p>
          <p className="text-sm text-neutral-medium">
            Click to select or drag and drop
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Helper Text */}
        <div className="bg-primary-light rounded-2xl p-5 text-left mb-6">
          <p className="text-sm text-ink leading-relaxed">
            <span className="font-semibold">Pro tip:</span> Use good lighting and a simple background for best results.
          </p>
        </div>

        {/* Example Link */}
        <Button variant="tertiary" fullWidth>
          See Example Photos
        </Button>
      </Card>
    </Container>
  );
}
