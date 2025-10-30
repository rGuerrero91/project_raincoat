import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { ClothingItem } from '../page';

interface RecommendationsScreenProps {
  items: ClothingItem[];
  location: { city: string };
  onNext: () => void;
}

// Mock outfit recommendations
const mockOutfits = [
  {
    name: 'Smart Casual',
    itemCount: 3,
    reason: 'Polished but comfortable',
    items: [0, 1], // indexes from closet items
  },
  {
    name: 'Comfortable Day',
    itemCount: 2,
    reason: 'Relaxed and practical',
    items: [0], // indexes from closet items
  },
  {
    name: 'Evening Ready',
    itemCount: 3,
    reason: 'Elevated and stylish',
    items: [1], // indexes from closet items
  },
];

export default function RecommendationsScreen({
  items,
  location,
  onNext,
}: RecommendationsScreenProps) {
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-medium text-white mb-2">
          Perfect for Today
        </h2>
        <p className="text-white/80">
          68°F, Partly Cloudy in {location.city}
        </p>
      </div>

      {/* Outfit Cards */}
      <div className="space-y-4 mb-6">
        {mockOutfits.map((outfit, index) => (
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
                      src={item.image}
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
