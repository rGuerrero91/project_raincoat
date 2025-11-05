import { Button } from './ui/button';
import { Lock, Smartphone, Shield } from 'lucide-react';

interface PrivacyPromiseScreenProps {
  onContinue: () => void;
}

export default function PrivacyPromiseScreen({ onContinue }: PrivacyPromiseScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#e1f5e1]">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
            <Lock className="w-10 h-10 text-[#2e7d32]" />
          </div>
          
          <h1 className="text-[#212121]">Your Photos Stay on Your Device</h1>
        </div>

        <div className="space-y-4 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#e3f2fd] rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-[#1976d2]" />
            </div>
            <div className="flex-1">
              <p className="text-[#212121]">AI processes everything locally</p>
              <p className="text-[#757575] text-sm">All photo analysis happens on your device</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#e1f5e1] rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#2e7d32]" />
            </div>
            <div className="flex-1">
              <p className="text-[#212121]">Photos never leave your phone</p>
              <p className="text-[#757575] text-sm">Your images stay private and secure</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#fff3e0] rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#f57c00]" />
            </div>
            <div className="flex-1">
              <p className="text-[#212121]">Only text tags and AI metadata sent to cloud</p>
              <p className="text-[#757575] text-sm">No personal photos uploaded anywhere</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={onContinue}
          size="lg"
          className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white"
        >
          Got It
        </Button>
      </div>
    </div>
  );
}
