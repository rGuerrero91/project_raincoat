import { Card } from './ui/card';
import { ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { WeatherData, ClothingItem, Outfit } from '../App';

interface OutfitRecommendationsProps {
  weather: WeatherData | null;
  items: ClothingItem[];
  onSelectOutfit: (outfit: Outfit) => void;
}

export default function OutfitRecommendations({ weather, items, onSelectOutfit }: OutfitRecommendationsProps) {
  // Create outfit recommendations based on available items
  const outfits: Outfit[] = [
    {
      id: '1',
      name: 'Smart Casual',
      items: items.slice(0, 3),
      reason: 'Polished but comfortable',
      whyItWorks: [
        `Perfect for ${weather?.temp}°F weather`,
        'Casual but polished',
        'Versatile for multiple occasions'
      ]
    },
    {
      id: '2',
      name: 'Comfortable Day',
      items: items.slice(1, 4),
      reason: 'Relaxed and practical',
      whyItWorks: [
        'Great for all-day comfort',
        'Weather-appropriate layers',
        'Easy to move in'
      ]
    },
    {
      id: '3',
      name: 'Evening Ready',
      items: [items[0], items[3], items[4]].filter(Boolean),
      reason: 'Elevated and stylish',
      whyItWorks: [
        'Stylish for evening plans',
        'Comfortable temperature range',
        'Put-together without trying too hard'
      ]
    }
  ];

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-[#212121]">Perfect for Today</h1>
          <p className="text-[#757575]">
            {weather?.temp}°F, {weather?.condition}
          </p>
        </div>

        <div className="space-y-4">
          {outfits.map((outfit) => (
            <Card
              key={outfit.id}
              onClick={() => onSelectOutfit(outfit)}
              className="p-5 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                  {outfit.items.slice(0, 3).map((item, idx) => (
                    <div 
                      key={item.id}
                      className="w-16 h-16 rounded-full bg-[#fafafa] border-2 border-white overflow-hidden"
                      style={{ zIndex: outfit.items.length - idx }}
                    >
                      <ImageWithFallback
                        src={item.image}
                        alt={item.tags[0]}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="text-[#212121]">{outfit.name}</h3>
                  <p className="text-[#757575] text-sm">{outfit.items.length} items • {outfit.reason}</p>
                </div>

                <ArrowRight className="w-5 h-5 text-[#757575]" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
