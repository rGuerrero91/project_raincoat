import { Button } from './ui/button';
import { Upload, Camera } from 'lucide-react';

interface AddFirstItemScreenProps {
  onUpload: () => void;
}

export default function AddFirstItemScreen({ onUpload }: AddFirstItemScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#e3f2fd] rounded-2xl">
            <Camera className="w-12 h-12 text-[#1976d2]" />
          </div>
          
          <h1 className="text-[#212121]">Add Your First Item</h1>
          
          <p className="text-[#757575]">
            Add a photo of a clothing item, it can be the piece by itself or a selfie (photos don't get uploaded anywhere)
          </p>
        </div>

        <div 
          onClick={onUpload}
          className="border-2 border-dashed border-[#1976d2] rounded-2xl p-12 bg-[#e3f2fd]/30 hover:bg-[#e3f2fd]/50 cursor-pointer transition-colors"
        >
          <div className="flex flex-col items-center gap-4">
            <Upload className="w-12 h-12 text-[#1976d2]" />
            <div className="text-center">
              <p className="text-[#212121]">Upload Photo</p>
              <p className="text-[#757575] text-sm">Tap to select an image</p>
            </div>
          </div>
        </div>

        <div className="bg-[#fff3e0] rounded-xl p-4">
          <p className="text-[#757575] text-sm">
            <span className="text-[#f57c00]">Pro tip:</span> Use good lighting and a simple background for best results
          </p>
        </div>
      </div>
    </div>
  );
}
