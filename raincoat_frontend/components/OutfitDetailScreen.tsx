import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Heart, Search } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Outfit, ClothingItem } from '../App';

interface OutfitDetailScreenProps {
  outfit: Outfit | null;
  onBack: () => void;
  onFindSimilar: (item: ClothingItem) => void;
}

export default function OutfitDetailScreen({ outfit, onBack, onFindSimilar }: OutfitDetailScreenProps) {
  if (!outfit) return null;

  const categoryNames: Record<string, string> = {
    top: 'Top',
    bottom: 'Bottom',
    shoes: 'Shoes',
    accessory: 'Accessory',
    outerwear: 'Outerwear'
  };

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
          <h2 className="text-[#212121] flex-1">{outfit.name}</h2>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {outfit.items.map((item) => (
            <div key={item.id} className="aspect-square bg-[#fafafa] rounded-xl overflow-hidden">
              <ImageWithFallback
                src={item.image}
                alt={item.tags[0]}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-[#212121]">Outfit Breakdown</h3>
          {outfit.items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-[#fafafa] rounded-lg overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.tags[0]}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[#757575] text-sm">{categoryNames[item.category]}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
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
                <Button
                  onClick={() => onFindSimilar(item)}
                  variant="ghost"
                  size="icon"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="bg-[#e1f5e1] rounded-2xl p-6 space-y-3">
          <h3 className="text-[#212121]">Why this works:</h3>
          <ul className="space-y-2">
            {outfit.whyItWorks.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#2e7d32]">•</span>
                <span className="text-[#212121]">{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-4xl mx-auto">
            <Button
              size="lg"
              className="w-full bg-[#1976d2] hover:bg-[#1565c0] text-white gap-2"
            >
              <Heart className="w-5 h-5" />
              Save Outfit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
