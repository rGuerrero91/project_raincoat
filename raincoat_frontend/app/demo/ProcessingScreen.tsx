'use client';

import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Card from '@/components/Card';
import { Palette, Search, Tag as TagIcon, Clock, Lock } from 'lucide-react';
import { onnxProcessor } from '@/lib/onnx-processor';

interface ProcessingScreenProps {
  imageFile: File;
  croppedImageUrl?: string;
  onComplete: (result: {
    embedding: number[];
    tags: string[];
    topTag: string; // Highest confidence tag to use as item name
    processedImageUrl: string;
    processedImageBlob: Blob
  }) => void;
}

const processingSteps = [
  { label: 'Removing background...', icon: Palette },
  { label: 'Analyzing item...', icon: Search },
  { label: 'Generating tags...', icon: TagIcon },
];

export default function ProcessingScreen({ imageFile, croppedImageUrl, onComplete }: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing) {
      console.log('[ProcessingScreen] Already processing, skipping...');
      return;
    }

    let isCancelled = false;
    setIsProcessing(true);

    const processImage = async () => {
      try {
        console.log('[ProcessingScreen] Starting ONNX processing');

        let fileToProcess = imageFile;

        if (croppedImageUrl) {
          console.log('[ProcessingScreen] Using YOLO-cropped image');
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          fileToProcess = new File([blob], imageFile.name, { type: imageFile.type });
        }

        const result = await onnxProcessor.processImage(
          fileToProcess,
          (step) => {
            if (isCancelled) return;

            if (step.includes('background')) {
              setCurrentStep(0);
            } else if (step.includes('Analyzing')) {
              setCurrentStep(1);
            } else if (step.includes('tags')) {
              setCurrentStep(2);
            }
          }
        );

        if (isCancelled) {
          console.log('[ProcessingScreen] Processing cancelled');
          return;
        }

        // Extract tag labels and get the top tag (highest confidence)
        const tagLabels = result.tags.map(t => t.label);
        const topTag = result.tags.length > 0 ? result.tags[0].label : 'Clothing Item';

        console.log('[ProcessingScreen] Processing complete:', {
          embeddingLength: result.embedding.length,
          tagCount: result.tags.length,
          tags: tagLabels,
          topTag: topTag,
          topTagScore: result.tags.length > 0 ? result.tags[0].score.toFixed(3) : 'N/A'
        });

        onComplete({
          embedding: result.embedding,
          tags: tagLabels,
          topTag: topTag,
          processedImageUrl: result.processedImageUrl,
          processedImageBlob: result.processedImageBlob,
        });
      } catch (err) {
        if (isCancelled) return;
        console.error('[ProcessingScreen] Processing failed:', err);
        setError(err instanceof Error ? err.message : 'Processing failed');
      }
    };

    processImage();

    return () => {
      console.log('[ProcessingScreen] Cleanup - cancelling processing');
      isCancelled = true;
    };
  }, [imageFile]);

  return (
    <Container className="flex items-center justify-center min-h-screen">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-2xl">
            <p className="text-red-700 font-semibold text-lg mb-2">Error: {error}</p>
            <p className="text-sm text-red-600">
              Make sure the Rails API is running on port 3000
            </p>
          </div>
        )}

        {/* Headline */}
        <h2 className="text-headline font-bold mb-4">
          Processing <strong className="text-primary">locally</strong>
        </h2>

        <p className="text-lg text-neutral-medium mb-8">
          Everything happens on your device
        </p>

        {/* Image Thumbnail */}
        <div className="mb-10 flex justify-center">
          <div className="relative w-40 h-40 rounded-3xl overflow-hidden shadow-medium">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Processing"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-primary/10 animate-pulse-subtle" />
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-3 mb-8">
          {processingSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isComplete = index < currentStep;
            const IconComponent = step.icon;
            
            return (
              <div
                key={index}
                className={`
                  flex items-center gap-4 p-5 rounded-2xl transition-all duration-300
                  ${
                    isActive
                      ? 'bg-primary-light border-2 border-primary'
                      : isComplete
                      ? 'bg-primary-light/50 border border-primary/30'
                      : 'bg-neutral-light border border-neutral-medium/20'
                  }
                `}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div className="flex-shrink-0">
                  {isComplete ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-neutral-medium" />
                  )}
                </div>
                <p className={`font-medium text-left flex-1 ${isActive ? 'text-primary' : 'text-neutral-medium'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time Estimate */}
        <div className="badge mb-6 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          <span>About 3-4 seconds</span>
        </div>

        {/* Privacy Reminder */}
        <div className="bg-primary-light rounded-2xl p-5">
          <p className="text-sm text-primary font-semibold flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Processing on your device • Photos never uploaded</span>
          </p>
        </div>
      </Card>
    </Container>
  );
}
