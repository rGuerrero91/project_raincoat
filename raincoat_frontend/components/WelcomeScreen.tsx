import { Button } from './ui/button';
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#e3f2fd] to-[#e1f5e1]">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
            <Sparkles className="w-10 h-10 text-[#1976d2]" />
          </div>
          
          <h1 className="text-[#212121]">Your Weather-Smart Wardrobe</h1>
          
          <p className="text-[#757575]">
            AI-powered outfit recommendations that respect your privacy
          </p>
        </div>

        <Button 
          onClick={onStart}
          size="lg"
          className="w-full bg-[#1976d2] hover:bg-[#1565c0] text-white"
        >
          Start Demo
        </Button>
      </div>
    </div>
  );
}
