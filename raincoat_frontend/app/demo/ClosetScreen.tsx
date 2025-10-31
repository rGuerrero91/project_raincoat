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
    <Container className="py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-headline font-bold mb-3">
          Your <strong className="text-primary">closet</strong>
        </h2>
        <p className="text-lg text-neutral-medium">
          {items.length} {items.length === 1 ? 'item' : 'items'} added
        </p>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {items.map((item, index) => (
          <Card
            key={index}
            padding="sm"
            hover
            className="cursor-pointer"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-light mb-3 shadow-soft">
              <img
                src={item.processedImage || item.image}
                alt={`Item ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {item.tags.slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-neutral-medium px-2.5 py-1">
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
          className="cursor-pointer border-2 border-dashed border-neutral-medium/30 flex items-center justify-center aspect-square transition-all hover:border-primary hover:bg-primary-light/20"
          onClick={onAddMore}
        >
          <div className="text-center">
            <div className="text-5xl mb-2">➕</div>
            <p className="text-sm font-semibold text-neutral-medium">
              Add Item
            </p>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button variant="primary" fullWidth onClick={onNext} className="text-lg py-4">
          Get Outfit Ideas
        </Button>

        {items.length < 3 && (
          <p className="text-center text-neutral-medium text-sm">
            Add at least 3 items for better recommendations
          </p>
        )}
      </div>
    </Container>
  );
}
