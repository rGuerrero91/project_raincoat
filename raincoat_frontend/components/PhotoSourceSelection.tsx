import { Button } from './ui/button';
import { Camera, Image, X } from 'lucide-react';

interface PhotoSourceSelectionProps {
  onSelect: (source: 'camera' | 'library') => void;
}

export default function PhotoSourceSelection({ onSelect }: PhotoSourceSelectionProps) {
  return (
    <div className="min-h-screen flex flex-col items-end justify-end p-0 bg-black/50">
      <div className="w-full bg-white rounded-t-3xl p-6 space-y-3 animate-in slide-in-from-bottom duration-300">
        <Button
          onClick={() => onSelect('camera')}
          variant="ghost"
          className="w-full justify-start gap-4 h-14"
        >
          <Camera className="w-5 h-5" />
          Take Photo
        </Button>
        
        <Button
          onClick={() => onSelect('library')}
          variant="ghost"
          className="w-full justify-start gap-4 h-14"
        >
          <Image className="w-5 h-5" />
          Choose from Library
        </Button>

        <div className="pt-2 border-t">
          <Button
            onClick={() => onSelect('library')}
            variant="ghost"
            className="w-full h-14 text-[#757575]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
