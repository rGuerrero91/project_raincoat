import { useState } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface CategoryScreenProps {
  onNext: (category: string) => void;
}

const categories = [
  { id: 'top', label: 'TOP', icon: '👕', enabled: true },
  { id: 'bottom', label: 'BOTTOM', icon: '👖', enabled: true },
  { id: 'accessory', label: 'ACCESSORY', icon: '👜', enabled: true },
  { id: 'shoes', label: 'SHOES', icon: '👟', enabled: true },
  { id: 'outerwear', label: 'OUTERWEAR', icon: '🧥', enabled: true },
];

export default function CategoryScreen({ onNext }: CategoryScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleNext = () => {
    if (selectedCategory) {
      onNext(selectedCategory);
    }
  };

  return (
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Headline */}
        <h2 className="text-3xl font-medium text-neutral-dark mb-3">
          Category
        </h2>

        {/* Subheading */}
        <p className="text-base text-neutral-medium mb-8">
          If more than one item is present, this will focus in on the closest match.
        </p>

        {/* Category Buttons Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              disabled={!category.enabled}
              className={`
                p-6 rounded-2xl border-2 transition-all
                ${
                  selectedCategory === category.id
                    ? 'border-accent-info bg-primary-blue shadow-lg scale-105'
                    : 'border-neutral-medium/30 bg-white hover:border-accent-info hover:shadow-md'
                }
                ${!category.enabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-4xl mb-2">{category.icon}</div>
              <p className="font-semibold text-neutral-dark">{category.label}</p>
            </button>
          ))}
        </div>

        {/* Next Button */}
        <Button
          variant="primary"
          fullWidth
          onClick={handleNext}
          disabled={!selectedCategory}
        >
          Continue
        </Button>
      </Card>
    </Container>
  );
}
