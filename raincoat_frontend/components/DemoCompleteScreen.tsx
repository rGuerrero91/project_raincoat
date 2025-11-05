import { Button } from './ui/button';
import { Check, RotateCcw } from 'lucide-react';

interface DemoCompleteScreenProps {
  onRestart: () => void;
}

export default function DemoCompleteScreen({ onRestart }: DemoCompleteScreenProps) {
  const features = [
    'Privacy-first photo processing',
    'AI-powered auto-tagging',
    'Weather-based recommendations',
    'Smart outfit creation',
    'Closet organization'
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#c8e6c9] to-[#e1f5e1]">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg animate-bounce">
            <Check className="w-12 h-12 text-[#2e7d32]" />
          </div>
          
          <h1 className="text-[#212121]">That's a Raincoat!</h1>
          
          <p className="text-[#757575]">
            You've experienced all the key features of our privacy-first wardrobe assistant
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-[#757575] mb-4">What you've explored:</p>
          <div className="space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#c8e6c9] rounded-full flex items-center justify-center mt-0.5">
                  <Check className="w-4 h-4 text-[#2e7d32]" />
                </div>
                <p className="text-[#212121] text-left">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onRestart}
            size="lg"
            className="w-full bg-[#1976d2] hover:bg-[#1565c0] text-white gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Restart Demo
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full"
          >
            Learn More
          </Button>
        </div>

        <div className="pt-4">
          <p className="text-[#757575] text-sm">
            Thank you for trying Raincoat!
          </p>
        </div>
      </div>
    </div>
  );
}
