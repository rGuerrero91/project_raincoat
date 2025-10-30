import { useState, useEffect, useRef } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { yoloDetector, YOLODetection } from '@/lib/yolo-detector';

interface CategoryScreenProps {
  detectedCategory?: string | null;  // YOLO-detected category
  croppedImageUrl?: string;  // Initial cropped image from YOLO
  originalImage?: HTMLImageElement;  // Original image for re-cropping
  allDetections?: YOLODetection[];  // All YOLO detections
  onNext: (category: string, croppedImageUrl?: string) => void;
}

const categories = [
  { id: 'top', label: 'TOP', icon: '👕', enabled: true },
  { id: 'bottom', label: 'BOTTOM', icon: '👖', enabled: true },
  { id: 'accessories', label: 'ACCESSORIES', icon: '👜', enabled: true },
  { id: 'shoes', label: 'SHOES', icon: '👟', enabled: true },
  { id: 'outerwear', label: 'OUTERWEAR', icon: '🧥', enabled: true },
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

  // Auto-select detected category
  useEffect(() => {
    if (detectedCategory) {
      console.log('[CategoryScreen] Auto-selected detected category:', detectedCategory);
      setSelectedCategory(detectedCategory);
    }
  }, [detectedCategory]);

  // Update crop preview when category changes
  useEffect(() => {
    if (!selectedCategory || !originalImage || !allDetections || allDetections.length === 0) {
      return;
    }

    // Find detection matching selected category
    const matchingDetection = allDetections.find(det => det.category === selectedCategory);

    if (matchingDetection) {
      // Re-crop to the selected category's bounding box
      const newCroppedUrl = yoloDetector.cropToBbox(originalImage, matchingDetection.bbox, 0.05);
      setCurrentCroppedUrl(newCroppedUrl);
      console.log('[CategoryScreen] Updated crop preview for category:', selectedCategory);
    } else if (croppedImageUrl) {
      // No matching detection, use original cropped image
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
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-4xl">
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

        {/* Main Content: Preview + Category Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Crop Preview */}
          {currentCroppedUrl && (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">Preview</h3>
              <div className="border-2 border-neutral-medium/30 rounded-2xl p-4 bg-white">
                <img
                  src={currentCroppedUrl}
                  alt="Cropped preview"
                  className="max-w-full max-h-80 object-contain rounded-lg"
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
            <h3 className="text-lg font-semibold text-neutral-dark mb-4">
              {currentCroppedUrl ? 'Change Category' : 'Select Category'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Confirmation Button */}
        <Button
          variant="primary"
          fullWidth
          onClick={handleConfirm}
          disabled={!selectedCategory}
        >
          Confirm & Continue
        </Button>
      </Card>
    </Container>
  );
}
