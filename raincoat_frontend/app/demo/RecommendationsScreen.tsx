'use client';

import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { ClothingItem } from '../page';
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

          // Update weather info if available
          if (response.data.weather) {
            const w = response.data.weather;
            setWeatherInfo(`${w.temperature}°F, ${w.condition}`);
          }

          // Map API recommendations to our format if available
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
      <Container className="flex items-center justify-center">
        <Card padding="lg" className="text-center max-w-xl">
          <div className="text-6xl mb-6 animate-float">👔</div>
          <h2 className="text-2xl font-medium text-neutral-dark mb-2">
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
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        {error && (
          <div className="mb-2 text-xs text-white/70 italic">
            {error}
          </div>
        )}
        <h2 className="text-3xl font-medium text-white mb-2">
          Perfect for Today
        </h2>
        <p className="text-white/80">
          {weatherInfo} in {location.city}
        </p>
      </div>

      {/* Outfit Cards */}
      <div className="space-y-4 mb-6">
        {outfits.map((outfit, index) => (
          <Card key={index} padding="md" hover className="cursor-pointer">
            {/* Outfit Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-semibold text-neutral-dark mb-1">
                  {outfit.name}
                </h3>
                <p className="text-sm text-neutral-medium">
                  {outfit.itemCount} items
                </p>
              </div>
              <div className="text-2xl">👔</div>
            </div>

            {/* Item Thumbnails */}
            <div className="flex gap-2 mb-3 overflow-x-auto">
              {outfit.items.map((itemIndex) => {
                const item = items[itemIndex];
                return item ? (
                  <div
                    key={itemIndex}
                    className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-light flex-shrink-0"
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
                    className="w-20 h-20 rounded-lg bg-neutral-light flex-shrink-0 flex items-center justify-center"
                  >
                    <span className="text-3xl">👕</span>
                  </div>
                ))}
            </div>

            {/* Reason */}
            <p className="text-sm text-neutral-medium italic">
              "{outfit.reason}"
            </p>

            {/* Match Badge */}
            <div className="mt-3 inline-flex items-center gap-2 bg-accent-success/20 text-accent-success px-3 py-1 rounded-full text-sm font-medium">
              <span>✓</span>
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

        <button className="btn-secondary w-full">
          See Similar Items
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-white/90 backdrop-blur-sm rounded-lg">
        <p className="text-sm text-neutral-dark text-center">
          💡 Based on AI analysis of your closet and current weather
        </p>
      </div>
    </Container>
  );
}
