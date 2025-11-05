import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { ClothingItem } from '../App';

interface QuickAddItemsProps {
  onComplete: (items: ClothingItem[]) => void;
}

export default function QuickAddItems({ onComplete }: QuickAddItemsProps) {
  const preloadedItems: ClothingItem[] = [
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1578314921455-34dd4626b38d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHNuZWFrZXJzJTIwc2hvZXN8ZW58MXx8fHwxNzYxNzgwMjc2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['white', 'sneakers', 'casual', 'comfortable'],
      category: 'shoes'
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1713880442898-0f151fba5e16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwamVhbnMlMjBkZW5pbXxlbnwxfHx8fDE3NjE3MTcxNjh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['blue', 'jeans', 'denim', 'casual'],
      category: 'bottom'
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1606715791286-6e43e9838f44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGxlYXRoZXIlMjBqYWNrZXR8ZW58MXx8fHwxNzYxNjk5MjY0fDA&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['black', 'leather', 'jacket', 'outerwear'],
      category: 'outerwear'
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1760446032400-506ec8963e6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5nbGFzc2VzJTIwYWNjZXNzb3J5fGVufDF8fHx8MTc2MTc1NDI2M3ww&ixlib=rb-4.1.0&q=80&w=1080',
      tags: ['sunglasses', 'black', 'accessory'],
      category: 'accessory'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-[#212121]">Let's add a few more items</h1>
          <p className="text-[#757575]">
            We'll use some examples to speed things up
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {preloadedItems.map((item) => (
            <Card key={item.id} className="p-4 space-y-3">
              <div className="aspect-square bg-[#fafafa] rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={item.image}
                  alt={item.tags[0]}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[#757575] text-sm capitalize">{item.tags.slice(0, 2).join(', ')}</p>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => onComplete([])}
            variant="outline"
            className="flex-1"
          >
            Skip
          </Button>
          <Button
            onClick={() => onComplete(preloadedItems)}
            className="flex-1 bg-[#1976d2] hover:bg-[#1565c0] text-white"
          >
            Add All
          </Button>
        </div>
      </div>
    </div>
  );
}
