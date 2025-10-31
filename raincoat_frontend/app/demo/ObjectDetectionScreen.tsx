'use client';

import { useEffect, useState, useRef } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
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
  accessories: 'Accessories'
};

export default function ObjectDetectionScreen({ imageFile, onDetectionSelected }: ObjectDetectionScreenProps) {
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

        // Load image
        const img = new Image();
        const imageUrl = URL.createObjectURL(imageFile);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        if (isCancelled) return;

        setImageElement(img);

        // Initialize and run YOLO detection
        await yoloDetector.initialize();

        if (isCancelled) return;

        const results = await yoloDetector.detect(img);

        if (isCancelled) return;

        console.log('[ObjectDetectionScreen] Detections:', results);
        setDetections(results);

        // Draw detections on canvas
        if (canvasRef.current && results.length > 0) {
          yoloDetector.drawDetections(canvasRef.current, img, results);
        }

        setIsDetecting(false);

        // Auto-select if only one detection
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

  const handleSelectDetection = (detection: YOLODetection) => {
    if (!imageElement) return;

    console.log('[ObjectDetectionScreen] User selected:', detection.category);

    // Crop to selected detection
    const croppedUrl = yoloDetector.cropToBbox(imageElement, detection.bbox, 0.05);

    // Pass all data including original image and all detections for re-cropping
    onDetectionSelected(detection, croppedUrl, imageElement, detections);
  };

  const handleSkipDetection = () => {
    console.log('[ObjectDetectionScreen] User skipped detection');

    if (!imageElement) return;

    // Use full image
    const fullImageUrl = URL.createObjectURL(imageFile);

    // Pass image element and empty detections array even when skipping
    onDetectionSelected(null, fullImageUrl, imageElement, detections);
  };

  if (isDetecting) {
    return (
      <Container className="flex items-center justify-center">
        <Card padding="lg" className="text-center max-w-xl">
          <div className="text-6xl mb-6 animate-float">🔍</div>
          <h2 className="text-2xl font-medium text-neutral-dark mb-2">
            Detecting clothing items...
          </h2>
          <p className="text-neutral-medium">
            Using AI to find items in your photo
          </p>

          {/* Loading animation */}
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-3 h-3 bg-accent-info rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-accent-info rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-accent-info rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="flex items-center justify-center">
        <Card padding="lg" className="text-center max-w-xl">
          <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg">
            <p className="text-yellow-700 font-semibold">⚠️ Detection unavailable</p>
            <p className="text-sm text-yellow-600 mt-2">{error}</p>
          </div>

          <h2 className="text-2xl font-medium text-neutral-dark mb-4">
            Continue without detection?
          </h2>

          <Button variant="primary" fullWidth onClick={handleSkipDetection}>
            Continue with Full Image
          </Button>
        </Card>
      </Container>
    );
  }

  if (detections.length === 0) {
    return (
      <Container className="flex items-center justify-center">
        <Card padding="lg" className="text-center max-w-xl">
          <div className="mb-6 p-4 bg-blue-100 border-2 border-blue-300 rounded-lg">
            <p className="text-blue-700 font-semibold">ℹ️ No items detected</p>
            <p className="text-sm text-blue-600 mt-2">
              We couldn't find any clothing items in this photo
            </p>
          </div>

          <h2 className="text-2xl font-medium text-neutral-dark mb-4">
            Continue with full image?
          </h2>

          <Button variant="primary" fullWidth onClick={handleSkipDetection}>
            Continue Anyway
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-medium text-white mb-2">
          Select an Item
        </h2>
        <p className="text-white/80">
          Found {detections.length} {detections.length === 1 ? 'item' : 'items'} in your photo
        </p>
      </div>

      {/* Image with detections */}
      {imageElement && (
        <Card padding="md" className="mb-6">
          <div className="relative w-full flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </Card>
      )}

      {/* Detection options */}
      <div className="space-y-3 mb-6">
        {detections.map((detection, index) => (
          <Card
            key={index}
            padding="md"
            hover
            className="cursor-pointer"
            onClick={() => handleSelectDetection(detection)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-neutral-dark">
                  {categoryDisplayNames[detection.category] || detection.category}
                </h3>
                <p className="text-sm text-neutral-medium">
                  Confidence: {(detection.confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-3xl">
                {detection.category === 'top' && '👕'}
                {detection.category === 'bottom' && '👖'}
                {detection.category === 'outerwear' && '🧥'}
                {detection.category === 'shoes' && '👟'}
                {detection.category === 'accessories' && '🎒'}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Skip button */}
      <Button variant="secondary" fullWidth onClick={handleSkipDetection}>
        Use Full Image Instead
      </Button>
    </Container>
  );
}
