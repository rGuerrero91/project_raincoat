'use client';

import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Card from '@/components/Card';

interface ProcessingScreenProps {
  imageFile: string;
  onComplete: (result: { embedding: number[]; tags: string[] }) => void;
}

const processingSteps = [
  'Removing background...',
  'Analyzing item...',
  'Generating tags...',
];

export default function ProcessingScreen({ imageFile, onComplete }: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Simulate processing steps
    const stepDuration = 1200; // 1.2 seconds per step

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < processingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, stepDuration);

    // Complete after all steps
    const timeout = setTimeout(() => {
      // Mock result - in production this would come from ONNX processor
      onComplete({
        embedding: Array(512).fill(0).map(() => Math.random()),
        tags: ['casual', 'cotton', 'blue', 'comfortable', 'summer', 'lightweight'],
      });
    }, stepDuration * processingSteps.length + 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Headline */}
        <h2 className="text-3xl font-medium text-neutral-dark mb-6">
          Processing Locally...
        </h2>

        {/* Image Thumbnail */}
        {imageFile && (
          <div className="mb-8 flex justify-center">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-md">
              <img
                src={imageFile}
                alt="Processing"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-accent-info/10 animate-pulse-subtle" />
            </div>
          </div>
        )}

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
