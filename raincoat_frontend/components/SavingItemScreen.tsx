import { useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SavingItemScreenProps {
  onComplete: () => void;
}

export default function SavingItemScreen({ onComplete }: SavingItemScreenProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setSaved(true), 800);
    const timer2 = setTimeout(() => onComplete(), 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#c8e6c9]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
          {saved ? (
            <Check className="w-10 h-10 text-[#2e7d32]" />
          ) : (
            <Loader2 className="w-10 h-10 text-[#2e7d32] animate-spin" />
          )}
        </div>
        
        <h2 className="text-[#212121]">
          {saved ? 'Item added!' : 'Adding to your closet...'}
        </h2>
      </div>
    </div>
  );
}
