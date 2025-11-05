import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { ClothingItem } from '../App';

interface AutoTagsScreenProps {
  item: ClothingItem | null;
  onEdit: () => void;
  onConfirm: (tags: string[]) => void;
}

export default function AutoTagsScreen({ item, onEdit, onConfirm }: AutoTagsScreenProps) {
  const [tags, setTags] = useState([
    'red dress',
    'casual',
    'summer',
    'cotton',
    'sleeveless'
  ]);

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-[#212121]">How does this look?</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
          <div className="w-48 h-48 mx-auto bg-[#fafafa] rounded-xl overflow-hidden">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1554153117-6f0fc16ec6ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBzdW1tZXIlMjBkcmVzc3xlbnwxfHx8fDE3NjE3OTQ5NTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Clothing item"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <p className="text-[#757575]">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge 
                  key={tag}
                  variant="secondary"
                  className="gap-2 pr-2 bg-[#e3f2fd] text-[#1976d2] hover:bg-[#bbdefb]"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:bg-white/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex-1"
          >
            Edit Tags
          </Button>
          <Button
            onClick={() => onConfirm(tags)}
            className="flex-1 bg-[#1976d2] hover:bg-[#1565c0] text-white"
          >
            Looks Good
          </Button>
        </div>
      </div>
    </div>
  );
}
