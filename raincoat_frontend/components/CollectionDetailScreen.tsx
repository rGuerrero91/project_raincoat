import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Plus } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { ClothingItem } from '../App';

interface CollectionDetailScreenProps {
  collectionName: string | null;
  items: ClothingItem[];
  onBack: () => void;
}

export default function CollectionDetailScreen({ collectionName, items, onBack }: CollectionDetailScreenProps) {
  if (!collectionName) return null;

  const collectionItems = collectionName === 'All Items' 
    ? items 
    : collectionName === 'Casual'
    ? items.slice(0, 3)
    : [];

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 bg-white border-b p-4 z-10">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-[#212121]">{collectionName}</h2>
            <p className="text-[#757575] text-sm">{collectionItems.length} items</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {collectionItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {collectionItems.map((item) => (
              <Card key={item.id} className="p-3 space-y-3">
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
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#fafafa] rounded-full">
              <Plus className="w-10 h-10 text-[#757575]" />
            </div>
            <div>
              <h3 className="text-[#212121]">No items yet</h3>
              <p className="text-[#757575]">Drag items here or tap to add</p>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-4xl mx-auto">
            <Button
              size="lg"
              className="w-full bg-[#1976d2] hover:bg-[#1565c0] text-white gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Items
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
