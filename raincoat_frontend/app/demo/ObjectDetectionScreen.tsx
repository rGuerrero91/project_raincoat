'use client';

import { useEffect, useState, useRef } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import {
  Search,
  AlertTriangle,
  Info,
  Shirt as ShirtIcon,
  Shirt as BottomIcon,
  MapPinned as Hoodie,
  Footprints,
  Backpack,
} from 'lucide-react';
import yoloDetector, { type YOLODetection } from '@/lib/yolo-detector';

interface ObjectDetectionScreenProps {
  imageFile: File;
  onDetectionSelected: (
    detection: YOLODetection | null,
    croppedImageUrl: string,
    originalImage: HTMLImageElement,
    allDetections: YOLODetection[]
  ) => void;
}

const categoryDisplayNames: { [key: string]: string } = {
  top: 'Top',
  bottom: 'Bottom',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessories: 'Accessories',
};

const categoryIcons: {
  [key: string]: React.ComponentType<{ className?: string }>;
} = {
  top: ShirtIcon,
  bottom: BottomIcon,
  outerwear: Hoodie,
  shoes: Footprints,
  accessories: Backpack,
};

export default function ObjectDetectionScreen({
  imageFile,
  onDetectionSelected,
}: ObjectDetectionScreenProps) {
  const [isDetecting, setIsDetecting] = useState(true);
  const [detections, setDetections] = useState<YOLODetection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const detectObjects = async () => {
      try {
        console.log('[ObjectDetectionScreen] Starting YOLO detection');

        const img = new Image();
        const imageUrl = URL.createObjectURL(imageFile);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        if (isCancelled) return;

        setImageElement(img);

        await yoloDetector.initialize();

        if (isCancelled) return;

        const results = await yoloDetector.detect(img);

        if (isCancelled) return;

        console.log('[ObjectDetectionScreen] Detections:', results);
        setDetections(results);

        if (canvasRef.current && results.length > 0) {
          yoloDetector.drawDetections(canvasRef.current, img, results);
        }

        setIsDetecting(false);

        if (results.length === 1) {
          console.log('[ObjectDetectionScreen] Auto-selecting single detection');
          setTimeout(() => handleSelectDetection(results[0]), 1000);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('[ObjectDetectionScreen] Detection failed:', err);
        setError(err instanceof Error ? err.message : 'Detection failed');
        setIsDetecting(false);
      }
    };

    detectObjects();

    return () => {
      isCancelled = true;
    };
  }, [imageFile]);

  const handleSelectDetection = async (detection: YOLODetection) => {
    if (!imageElement) return;

    console.log('[ObjectDetectionScreen] User selected:', detection.category);

    const croppedUrl = await yoloDetector.cropToBbox(imageElement, detection.bbox, 0.05);

    onDetectionSelected(detection, croppedUrl, imageElement, detections);
  };

  const handleSkipDetection = () => {
    console.log('[ObjectDetectionScreen] User skipped detection');

    if (!imageElement) return;

    const fullImageUrl = URL.createObjectURL(imageFile);

    onDetectionSelected(null, fullImageUrl, imageElement, detections);
  };

  if (isDetecting) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Card padding="xl" className="text-center max-w-2xl w-full">
          <div className="flex justify-center mb-6 animate-float">
            <Search className="w-24 h-24 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-headline font-bold mb-2">Detecting clothing items...</h2>
          <p className="text-neutral-medium mb-6">Using AI to find items in your photo</p>

          {/* Loading animation */}
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
            <div
              className="w-3 h-3 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: '0.2s' }}
            />
            <div
              className="w-3 h-3 bg-primary rounded-full animate-pulse"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Card padding="xl" className="text-center max-w-2xl w-full">
          <div className="mb-6 p-5 bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-700" />
              <p className="text-yellow-700 font-semibold">Detection unavailable</p>
            </div>
            <p className="text-sm text-yellow-600">{error}</p>
          </div>

          <h2 className="text-headline font-bold mb-4">Continue without detection?</h2>

          <Button variant="primary" fullWidth onClick={handleSkipDetection}>
            Continue with Full Image
          </Button>
        </Card>
      </Container>
    );
  }

  if (detections.length === 0) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Card padding="xl" className="text-center max-w-2xl w-full">
          <div className="mb-6 p-5 bg-primary-light border-2 border-primary/30 rounded-2xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Info className="w-5 h-5 text-primary" />
              <p className="text-primary font-semibold">No items detected</p>
            </div>
            <p className="text-sm text-primary">
              We couldn&apos;t find any clothing items in this photo
            </p>
          </div>

          <h2 className="text-headline font-bold mb-4">Continue with full image?</h2>

          <Button variant="primary" fullWidth onClick={handleSkipDetection}>
            Continue Anyway
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8 min-h-screen">
      <div className="mb-8 text-center">
        <h2 className="text-headline font-bold mb-3">
          Select an <strong className="text-primary">item</strong>
        </h2>
        <p className="text-lg text-neutral-medium">
          Found {detections.length} {detections.length === 1 ? 'item' : 'items'} in your photo
        </p>
      </div>

      {/* Image with detections */}
      {imageElement && (
        <Card padding="md" className="mb-6">
          <div className="relative w-full flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-2xl"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </Card>
      )}

      {/* Detection options */}
      <div className="space-y-3 mb-6">
        {detections.map((detection, index) => {
          const CategoryIcon = categoryIcons[detection.category] || ShirtIcon;
          return (
            <Card
              key={index}
              padding="md"
              hover
              className="cursor-pointer"
              onClick={() => handleSelectDetection(detection)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-ink">
                    {categoryDisplayNames[detection.category] || detection.category}
                  </h3>
                  <p className="text-sm text-neutral-medium">
                    Confidence: {(detection.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center">
                  <CategoryIcon
                    className="w-7 h-7 text-primary"
                    // strokeWidth={2}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Skip button */}
      <Button variant="secondary" fullWidth onClick={handleSkipDetection}>
        Use Full Image Instead
      </Button>
    </Container>
  );
}
