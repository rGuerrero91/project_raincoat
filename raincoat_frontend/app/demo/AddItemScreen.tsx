'use client';

import { useRef } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';

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
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Empty State Illustration */}
        <div className="text-8xl mb-6">👔</div>

        {/* Headline */}
        <h2 className="text-3xl font-medium text-neutral-dark mb-3">
          Add Your First Item
        </h2>

        {/* Subheading */}
        <p className="text-lg text-neutral-medium mb-2">
          Add a photo of a clothing item, it can be the piece by itself or a selfie
        </p>

        <p className="text-sm text-neutral-medium mb-8 opacity-75">
          (photos don't get uploaded anywhere)
        </p>

        {/* Upload Area */}
        <div
          onClick={handleUploadClick}
          className="border-2 border-dashed border-neutral-medium/30 rounded-2xl p-12 mb-6 cursor-pointer hover:border-accent-info hover:bg-primary-blue/30 transition-all"
        >
          <div className="text-5xl mb-3">📸</div>
          <p className="text-lg font-semibold text-neutral-dark">
            Upload Photo
          </p>
          <p className="text-sm text-neutral-medium mt-2">
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
        <div className="bg-primary-amber/30 rounded-lg p-4 text-left">
          <p className="text-sm text-neutral-dark">
            <span className="font-semibold">Pro tip:</span> Use good lighting and a simple background
          </p>
        </div>

        {/* Example Link */}
        <button className="btn-tertiary mt-6 w-full">
          See Example Photos
        </button>
      </Card>
    </Container>
  );
}
