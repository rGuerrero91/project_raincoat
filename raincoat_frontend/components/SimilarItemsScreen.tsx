import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { ClothingItem } from '../App';

interface SimilarItemsScreenProps {
  originalItem: ClothingItem | null;
  items: ClothingItem[];
  onBack: () => void;
}

export default function SimilarItemsScreen({ originalItem, items, onBack }: SimilarItemsScreenProps) {
  if (!originalItem) return null;

  // Simulate similarity matching - filter items by category and calculate mock similarity
  const similarItems = items
    .filter(item => item.id !== originalItem.id)
    .map(item => ({
      ...item,
      similarity: Math.floor(Math.random() * 20) + 75 // 75-95% similarity
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6);

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 bg-white border-b p-4 z-10">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-[#212121] flex-1">Similar Items</h2>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <p className="text-[#757575] mb-4">Original Item</p>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-[#fafafa] rounded-lg overflow-hidden flex-shrink-0">
                <ImageWithFallback
                  src={originalItem.image}
                  alt={originalItem.tags[0]}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-1">
                  {originalItem.tags.slice(0, 3).map((tag) => (
                    <Badge 
                      key={tag}
                      variant="secondary"
                      className="text-xs bg-[#e3f2fd] text-[#1976d2]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <p className="text-[#757575] mb-4">Similar to this item</p>
          <div className="grid grid-cols-2 gap-4">
            {similarItems.map((item) => (
              <Card key={item.id} className="p-3 space-y-3">
                <div className="relative">
                  <div className="aspect-square bg-[#fafafa] rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.tags[0]}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-[#2e7d32] text-white px-2 py-1 rounded-full text-xs">
                    {item.similarity}% match
                  </div>
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
        </div>

        <div className="bg-[#e3f2fd] rounded-xl p-4">
          <p className="text-[#757575] text-sm">
            Based on AI analysis of style, color, and fit
          </p>
        </div>
      </div>
    </div>
  );
}
