import { useState, useEffect, useRef } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Shirt, RectangleHorizontal, Backpack, Footprints, MapPinned as Hoodie } from 'lucide-react';
import { yoloDetector, YOLODetection } from '@/lib/yolo-detector';

interface CategoryScreenProps {
  detectedCategory?: string | null;
  croppedImageUrl?: string;
  originalImage?: HTMLImageElement;
  allDetections?: YOLODetection[];
  onNext: (category: string, croppedImageUrl?: string) => void;
}

const categories = [
  { id: 'tops', label: 'TOP', icon: Shirt, enabled: true },
  { id: 'bottoms', label: 'BOTTOM', icon: RectangleHorizontal, enabled: true },
  { id: 'accessories', label: 'ACCESSORIES', icon: Backpack, enabled: true },
  { id: 'shoes', label: 'SHOES', icon: Footprints, enabled: true },
  { id: 'outerwear', label: 'OUTERWEAR', icon: Hoodie, enabled: true },
];

export default function CategoryScreen({
  detectedCategory,
  croppedImageUrl,
  originalImage,
  allDetections,
  onNext
}: CategoryScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(detectedCategory || null);
  const [currentCroppedUrl, setCurrentCroppedUrl] = useState<string | undefined>(croppedImageUrl);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (detectedCategory) {
      console.log('[CategoryScreen] Auto-selected detected category:', detectedCategory);
      setSelectedCategory(detectedCategory);
    }
  }, [detectedCategory]);

  useEffect(() => {
    if (!selectedCategory || !originalImage || !allDetections || allDetections.length === 0) {
      return;
    }

    const matchingDetection = allDetections.find(det => det.category === selectedCategory);

    if (matchingDetection) {
      const newCroppedUrl = yoloDetector.cropToBbox(originalImage, matchingDetection.bbox, 0.05);
      setCurrentCroppedUrl(newCroppedUrl);
      console.log('[CategoryScreen] Updated crop preview for category:', selectedCategory);
    } else if (croppedImageUrl) {
      setCurrentCroppedUrl(croppedImageUrl);
    }
  }, [selectedCategory, originalImage, allDetections, croppedImageUrl]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleConfirm = () => {
    if (selectedCategory) {
      onNext(selectedCategory, currentCroppedUrl);
    }
  };

  return (
    <Container className="flex items-center justify-center min-h-screen">
      <Card padding="xl" className="text-center max-w-4xl w-full">
        {/* Headline */}
        <h2 className="text-headline font-bold mb-4">
          {detectedCategory ? 'Confirm' : 'Select'} <strong className="text-primary">Category</strong>
        </h2>

        {/* Subheading */}
        <p className="text-lg text-neutral-medium mb-8 leading-relaxed">
          {detectedCategory
            ? `We detected this as a ${selectedCategory}. You can change it if needed.`
            : 'What type of clothing item is this?'}
        </p>

        {/* Main Content: Preview + Category Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Crop Preview */}
          {currentCroppedUrl && (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-ink mb-4">Preview</h3>
              <div className="border-2 border-neutral-medium/30 rounded-3xl p-4 bg-white shadow-soft">
                <img
                  src={currentCroppedUrl}
                  alt="Cropped preview"
                  className="max-w-full max-h-80 object-contain rounded-2xl"
                />
              </div>
              {selectedCategory && (
                <p className="text-sm text-neutral-medium mt-2">
                  Showing crop for: <span className="font-semibold">{selectedCategory}</span>
                </p>
              )}
            </div>
          )}

          {/* Category Buttons Grid */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-ink mb-4">
              {currentCroppedUrl ? 'Change Category' : 'Select Category'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => {
                const IconComponent = category.icon;
                if (!IconComponent) {
                  console.error(`Icon component is undefined for category: ${category.id}`);
                  return null;
                }
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    disabled={!category.enabled}
                    className={`
                      p-6 rounded-2xl border-2 transition-all
                      ${
                        selectedCategory === category.id
                          ? 'border-primary bg-primary-light shadow-medium scale-105'
                          : 'border-neutral-medium/30 bg-white hover:border-primary/50 hover:shadow-soft'
                      }
                      ${!category.enabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex justify-center mb-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedCategory === category.id ? 'bg-primary' : 'bg-primary-light'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          selectedCategory === category.id ? 'text-white' : 'text-primary'
                        }`} strokeWidth={2} />
                      </div>
                    </div>
                    <p className="font-semibold text-ink">{category.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirmation Button */}
        <Button
          variant="primary"
          fullWidth
          onClick={handleConfirm}
          disabled={!selectedCategory}
          className="text-lg py-4"
        >
          Confirm & Continue
        </Button>
      </Card>
    </Container>
  );
}
