'use client';

import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Shirt, Lightbulb, Check } from 'lucide-react';
import { ClothingItem } from './page';
import apiClient from '@/lib/api';

interface RecommendationsScreenProps {
  items: ClothingItem[];
  location: { city: string };
  onNext: () => void;
}

interface Outfit {
  name: string;
  itemCount: number;
  reason: string;
  items: number[];
}

// Fallback outfit recommendations
const fallbackOutfits: Outfit[] = [
  {
    name: 'Smart Casual',
    itemCount: 3,
    reason: 'Polished but comfortable',
    items: [0, 1],
  },
  {
    name: 'Comfortable Day',
    itemCount: 2,
    reason: 'Relaxed and practical',
    items: [0],
  },
  {
    name: 'Evening Ready',
    itemCount: 3,
    reason: 'Elevated and stylish',
    items: [1],
  },
];

export default function RecommendationsScreen({
  items,
  location,
  onNext,
}: RecommendationsScreenProps) {
  const [outfits, setOutfits] = useState<Outfit[]>(fallbackOutfits);
  const [weatherInfo, setWeatherInfo] = useState<string>('68°F, Partly Cloudy');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        console.log('Fetching weather recommendations from API...');
        const response = await apiClient.getWeatherRecommendations();

        if (response.success && response.data) {
          console.log('Recommendations received:', response.data);

          if (response.data.weather) {
            const w = response.data.weather;
            setWeatherInfo(`${w.temperature}°F, ${w.condition}`);
          }

          if (response.data.recommendations && response.data.recommendations.length > 0) {
            const mappedOutfits = response.data.recommendations.map((rec: any, index: number) => ({
              name: rec.name || `Outfit ${index + 1}`,
              itemCount: rec.item_count || items.length,
              reason: rec.reason || rec.description || 'Weather appropriate',
              items: Array.from({ length: Math.min(items.length, 2) }, (_, i) => i),
            }));
            setOutfits(mappedOutfits);
          }
        } else {
          console.warn('Recommendations API returned no data, using fallback');
          setError('Using demo recommendations');
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError('Using demo recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [items]);

  if (isLoading) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Card padding="xl" className="text-center max-w-2xl w-full">
          <div className="flex justify-center mb-6 animate-float">
            <Shirt className="w-24 h-24 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-headline font-bold mb-2">
            Creating outfit ideas...
          </h2>
          <p className="text-neutral-medium">
            Analyzing your closet and weather
          </p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center">
        {error && (
          <div className="mb-2 text-xs text-neutral-medium italic">
            {error}
          </div>
        )}
        <h2 className="text-headline font-bold mb-3">
          Perfect for <strong className="text-primary">today</strong>
        </h2>
        <p className="text-lg text-neutral-medium">
          {weatherInfo} in {location.city}
        </p>
      </div>

      {/* Outfit Cards */}
      <div className="space-y-4 mb-8">
        {outfits.map((outfit, index) => (
          <Card key={index} padding="md" hover className="cursor-pointer">
            {/* Outfit Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-semibold text-ink mb-1">
                  {outfit.name}
                </h3>
                <p className="text-sm text-neutral-medium">
                  {outfit.itemCount} items
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                <Shirt className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
            </div>

            {/* Item Thumbnails */}
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {outfit.items.map((itemIndex) => {
                const item = items[itemIndex];
                return item ? (
                  <div
                    key={itemIndex}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-light flex-shrink-0"
                  >
                    <img
                      src={item.processedImage || item.image}
                      alt={`Item ${itemIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null;
              })}
              {/* Placeholder for missing items */}
              {Array(outfit.itemCount - outfit.items.length)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={`placeholder-${i}`}
                    className="w-20 h-20 rounded-xl bg-neutral-light flex-shrink-0 flex items-center justify-center"
                  >
                    <Shirt className="w-8 h-8 text-neutral-medium" strokeWidth={1.5} />
                  </div>
                ))}
            </div>

            {/* Reason */}
            <p className="text-sm text-neutral-medium italic mb-3">
              "{outfit.reason}"
            </p>

            {/* Match Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-3 py-1.5 rounded-full text-sm font-semibold">
              <Check className="w-4 h-4" />
              <span>Great match for weather</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="primary" fullWidth onClick={onNext}>
          Complete Demo
        </Button>

        <Button variant="secondary" fullWidth>
          See Similar Items
        </Button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-5 bg-primary-light rounded-2xl">
        <p className="text-sm text-ink text-center flex items-center justify-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span>Based on AI analysis of your closet and current weather</span>
        </p>
      </div>
    </Container>
  );
}
