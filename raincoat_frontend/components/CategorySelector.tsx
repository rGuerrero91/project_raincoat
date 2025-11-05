import { Button } from './ui/button';
import { Shirt, Grid2X2, Watch, Footprints } from 'lucide-react';

interface CategorySelectorProps {
  onSelect: (category: string) => void;
}

export default function CategorySelector({ onSelect }: CategorySelectorProps) {
  const categories = [
    { id: 'top', label: 'TOP', icon: Shirt, available: true },
    { id: 'bottom', label: 'BOTTOM', icon: Grid2X2, available: true },
    { id: 'accessory', label: 'ACCESSORY', icon: Watch, available: true },
    { id: 'shoes', label: 'SHOES', icon: Footprints, available: true },
    { id: 'outerwear', label: 'OUTERWEAR', icon: Shirt, available: false },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-[#212121]">Category</h1>
          <p className="text-[#757575]">
            If more than one item is present, this will focus in on the closest match.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                onClick={() => category.available && onSelect(category.id)}
                disabled={!category.available}
                variant="outline"
                className={`h-24 flex flex-col gap-2 ${
                  category.available 
                    ? 'border-[#1976d2] text-[#1976d2] hover:bg-[#e3f2fd]' 
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <Icon className="w-8 h-8" />
                <span>{category.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
