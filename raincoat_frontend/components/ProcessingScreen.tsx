import { useEffect, useState } from 'react';
import { Loader2, Check } from 'lucide-react';

interface ProcessingScreenProps {
  onComplete: () => void;
}

export default function ProcessingScreen({ onComplete }: ProcessingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Removing background',
    'Analyzing item',
    'Generating tags'
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setCurrentStep(1), 1200),
      setTimeout(() => setCurrentStep(2), 2400),
      setTimeout(() => onComplete(), 3600)
    ];

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#fff3e0]">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
            <Loader2 className="w-10 h-10 text-[#f57c00] animate-spin" />
          </div>
          
          <h1 className="text-[#212121]">Processing Locally...</h1>
          <p className="text-[#757575]">About 3-4 seconds</p>
        </div>

        <div className="space-y-4 bg-white rounded-2xl p-6 shadow-sm">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                index < currentStep 
                  ? 'bg-[#c8e6c9]' 
                  : index === currentStep 
                  ? 'bg-[#fff3e0]' 
                  : 'bg-[#fafafa]'
              }`}>
                {index < currentStep ? (
                  <Check className="w-4 h-4 text-[#2e7d32]" />
                ) : index === currentStep ? (
                  <Loader2 className="w-4 h-4 text-[#f57c00] animate-spin" />
                ) : (
                  <span className="text-[#757575] text-sm">{index + 1}</span>
                )}
              </div>
              <p className={`flex-1 ${
                index <= currentStep ? 'text-[#212121]' : 'text-[#757575]'
              }`}>
                {step}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-[#757575] text-sm">
            Processing on your device • Photos stay private
          </p>
        </div>
      </div>
    </div>
  );
}
