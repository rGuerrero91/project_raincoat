import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { ClothingItem } from '../page';

interface ClosetScreenProps {
  items: ClothingItem[];
  onNext: () => void;
  onAddMore: () => void;
}

export default function ClosetScreen({ items, onNext, onAddMore }: ClosetScreenProps) {
  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-medium text-white text-center mb-2">
          Your Closet
        </h2>
        <p className="text-white/80 text-center">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {items.map((item, index) => (
          <Card
            key={index}
            padding="sm"
            hover
            className="cursor-pointer"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-neutral-light mb-3">
              <img
                src={item.image}
                alt={`Item ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-wrap gap-1 min-h-[32px]">
              {item.tags.slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="text-xs bg-primary-blue text-accent-info px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-neutral-medium px-2 py-1">
                  +{item.tags.length - 3}
                </span>
              )}
            </div>
          </Card>
        ))}

        {/* Add More Card */}
        <Card
          padding="sm"
          hover
          className="cursor-pointer border-2 border-dashed border-neutral-medium/30 flex items-center justify-center aspect-square"
          onClick={onAddMore}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">➕</div>
            <p className="text-sm font-semibold text-neutral-medium">
              Add Item
            </p>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="primary" fullWidth onClick={onNext}>
          Get Outfit Ideas
        </Button>

        {items.length < 3 && (
          <p className="text-center text-white/70 text-sm">
            Add at least 3 items for better recommendations
          </p>
        )}
      </div>
    </Container>
  );
}
