import { useState, useEffect } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface CategoryScreenProps {
  detectedCategory?: string | null;  // YOLO-detected category
  onNext: (category: string) => void;
}

const categories = [
  { id: 'top', label: 'TOP', icon: '👕', enabled: true },
  { id: 'bottom', label: 'BOTTOM', icon: '👖', enabled: true },
  { id: 'accessories', label: 'ACCESSORIES', icon: '👜', enabled: true },
  { id: 'shoes', label: 'SHOES', icon: '👟', enabled: true },
  { id: 'outerwear', label: 'OUTERWEAR', icon: '🧥', enabled: true },
];

export default function CategoryScreen({ detectedCategory, onNext }: CategoryScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(detectedCategory || null);

  // Auto-select detected category
  useEffect(() => {
    if (detectedCategory) {
      console.log('[CategoryScreen] Auto-selected detected category:', detectedCategory);
      setSelectedCategory(detectedCategory);
    }
  }, [detectedCategory]);

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
          {detectedCategory ? 'Confirm Category' : 'Select Category'}
        </h2>

        {/* Subheading */}
        <p className="text-base text-neutral-medium mb-8">
          {detectedCategory
            ? `We detected this as a ${selectedCategory}. You can change it if needed.`
            : 'What type of clothing item is this?'}
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
