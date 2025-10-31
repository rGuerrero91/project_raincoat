'use client';

import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Card from '@/components/Card';
import { onnxProcessor } from '@/lib/onnx-processor';

interface ProcessingScreenProps {
  imageFile: File;
  croppedImageUrl?: string;  // YOLO-cropped image URL (if available)
  onComplete: (result: { embedding: number[]; tags: string[]; processedImageUrl: string }) => void;
}

const processingSteps = [
  'Removing background...',
  'Analyzing item...',
  'Generating tags...',
];

export default function ProcessingScreen({ imageFile, croppedImageUrl, onComplete }: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Prevent duplicate processing attempts
    if (isProcessing) {
      console.log('[ProcessingScreen] Already processing, skipping...');
      return;
    }

    let isCancelled = false;
    setIsProcessing(true);

    const processImage = async () => {
      try {
        console.log('[ProcessingScreen] Starting ONNX processing');

        // Convert cropped image URL to File if available
        let fileToProcess = imageFile;

        if (croppedImageUrl) {
          console.log('[ProcessingScreen] Using YOLO-cropped image');
          // Convert data URL to File
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          fileToProcess = new File([blob], imageFile.name, { type: imageFile.type });
        }

        const result = await onnxProcessor.processImage(
          fileToProcess,
          (step) => {
            if (isCancelled) return;

            // Map progress messages to step indices
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

        console.log('[ProcessingScreen] Processing complete:', {
          embeddingLength: result.embedding.length,
          tagCount: result.tags.length,
          tags: result.tags.map(t => t.label)
        });

        // Complete with real results
        onComplete({
          embedding: result.embedding,
          tags: result.tags.map(t => t.label),
          processedImageUrl: result.processedImageUrl,
        });
      } catch (err) {
        if (isCancelled) return;
        console.error('[ProcessingScreen] Processing failed:', err);
        setError(err instanceof Error ? err.message : 'Processing failed');
      }
    };

    processImage();

    // Cleanup function to cancel processing if component unmounts
    return () => {
      console.log('[ProcessingScreen] Cleanup - cancelling processing');
      isCancelled = true;
    };
  }, [imageFile]); // Removed onComplete from dependencies to prevent re-runs

  return (
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
            <p className="text-red-700 font-semibold">❌ {error}</p>
            <p className="text-sm text-red-600 mt-2">
              Make sure the Rails API is running on port 3000
            </p>
          </div>
        )}

        {/* Headline */}
        <h2 className="text-3xl font-medium text-neutral-dark mb-6">
          Processing Locally...
        </h2>

        {/* Image Thumbnail */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-md">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Processing"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-accent-info/10 animate-pulse-subtle" />
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-4 mb-8">
          {processingSteps.map((step, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-4 p-4 rounded-lg transition-all
                ${
                  index === currentStep
                    ? 'bg-primary-amber text-accent-warning'
                    : index < currentStep
                    ? 'bg-accent-success text-white'
                    : 'bg-neutral-light text-neutral-medium'
                }
              `}
            >
              <div className="flex-shrink-0">
                {index < currentStep ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : index === currentStep ? (
                  <div className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-current" />
                )}
              </div>
              <p className="font-medium text-left flex-1">{step}</p>
            </div>
          ))}
        </div>

        {/* Time Estimate */}
        <p className="text-sm text-neutral-medium">
          About 3-4 seconds
        </p>

        {/* Privacy Reminder */}
        <div className="mt-6 p-4 bg-primary-green rounded-lg">
          <p className="text-sm text-neutral-dark">
            🔒 Processing on your device
          </p>
        </div>
      </Card>
    </Container>
  );
}
