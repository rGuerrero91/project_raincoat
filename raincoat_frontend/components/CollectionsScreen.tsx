import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowLeft, Plus, FolderOpen } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { ClothingItem } from '../App';

interface CollectionsScreenProps {
  items: ClothingItem[];
  onSelectCollection: (name: string) => void;
  onBack: () => void;
}

export default function CollectionsScreen({ items, onSelectCollection, onBack }: CollectionsScreenProps) {
  const collections = [
    {
      name: 'All Items',
      count: items.length,
      items: items.slice(0, 4)
    },
    {
      name: 'Work',
      count: 0,
      items: []
    },
    {
      name: 'Casual',
      count: 3,
      items: items.slice(0, 3)
    },
    {
      name: 'Travel',
      count: 0,
      items: []
    }
  ];

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
          <h2 className="text-[#212121] flex-1">Your Collections</h2>
          <Button
            variant="outline"
            size="icon"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        {collections.map((collection) => (
          <Card
            key={collection.name}
            onClick={() => collection.count > 0 && onSelectCollection(collection.name)}
            className={`p-5 ${collection.count > 0 ? 'cursor-pointer hover:shadow-lg transition-shadow' : 'opacity-60'}`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {collection.items.length > 0 ? (
                  <div className="w-16 h-16 bg-[#fafafa] rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={collection.items[0].image}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-[#fafafa] rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-8 h-8 text-[#757575]" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-[#212121]">{collection.name}</h3>
                <p className="text-[#757575] text-sm">{collection.count} items</p>
              </div>

              {collection.items.length > 1 && (
                <div className="flex -space-x-2">
                  {collection.items.slice(1, 4).map((item) => (
                    <div 
                      key={item.id}
                      className="w-10 h-10 rounded-full bg-[#fafafa] border-2 border-white overflow-hidden"
                    >
                      <ImageWithFallback
                        src={item.image}
                        alt={item.tags[0]}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          className="w-full gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Collection
        </Button>
      </div>
    </div>
  );
}
