import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Sparkles, FolderOpen } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { ClothingItem } from '../App';

interface YourClosetScreenProps {
  items: ClothingItem[];
  onGetOutfits: () => void;
  onAddItem: () => void;
  onViewCollections: () => void;
  onItemClick: (item: ClothingItem) => void;
}

export default function YourClosetScreen({ 
  items, 
  onGetOutfits, 
  onAddItem, 
  onViewCollections,
  onItemClick 
}: YourClosetScreenProps) {
  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#212121]">Your Closet</h1>
            <p className="text-[#757575]">{items.length} items</p>
          </div>
          <Button
            onClick={onAddItem}
            size="icon"
            className="bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-full"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card 
              key={item.id}
              onClick={() => onItemClick(item)}
              className="p-3 space-y-3 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-[#fafafa] rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={item.image}
                  alt={item.tags[0]}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag) => (
                  <Badge 
                    key={tag}
                    variant="secondary"
                    className="text-xs bg-[#e3f2fd] text-[#1976d2]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-4xl mx-auto space-y-3">
            <Button
              onClick={onGetOutfits}
              size="lg"
              className="w-full bg-[#1976d2] hover:bg-[#1565c0] text-white gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Get Outfit Ideas
            </Button>
            <Button
              onClick={onViewCollections}
              variant="outline"
              size="lg"
              className="w-full gap-2"
            >
              <FolderOpen className="w-5 h-5" />
              View Collections
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
