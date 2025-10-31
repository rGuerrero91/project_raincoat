"use client";

import { useEffect, useRef, useState } from "react";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { Search, Shirt, RectangleHorizontal, Coat, Footprints, Backpack } from "lucide-react";
import yoloDetector, { type YOLODetection } from "@/lib/yolo-detector";

interface ObjectDetectionAndCategoryScreenProps {
  imageFile: File;
  onNext: (category: string, croppedImageUrl: string) => void;
}

const CATEGORY_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  top: { icon: Shirt, label: "Top" },
  bottom: { icon: RectangleHorizontal, label: "Bottom" },
  outerwear: { icon: Coat, label: "Outerwear" },
  shoes: { icon: Footprints, label: "Shoes" },
  accessories: { icon: Backpack, label: "Accessories" },
};

export default function ObjectDetectionAndCategoryScreen({
  imageFile,
  onNext,
}: ObjectDetectionAndCategoryScreenProps) {
  const [isDetecting, setIsDetecting] = useState<boolean>(true);
  const [detections, setDetections] = useState<YOLODetection[]>([]);
  const [bestByCategory, setBestByCategory] = useState<
    Record<string, YOLODetection | null>
  >(() =>
    Object.keys(CATEGORY_MAP).reduce(
      (acc, k) => {
        acc[k] = null;
        return acc;
      },
      {} as Record<string, YOLODetection | null>
    )
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // load image once
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    objectUrlRef.current = URL.createObjectURL(imageFile);

    img.onload = () => {
      if (!cancelled) {
        setImageElement(img);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setError("Failed to load image");
        setIsDetecting(false);
      }
    };
    img.src = objectUrlRef.current;

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [imageFile]);

  // run YOLO detection
  useEffect(() => {
    if (!imageElement) return;

    let cancelled = false;

    const detect = async () => {
      try {
        await yoloDetector.initialize();
        if (cancelled) return;

        const results = await yoloDetector.detect(imageElement);
        if (cancelled) return;

        // find best detection per category
        const best: Record<string, YOLODetection | null> = {};
        Object.keys(CATEGORY_MAP).forEach((cat) => {
          const matches = results.filter((r) => r.category === cat);
          best[cat] =
            matches.length > 0
              ? matches.reduce((prev, curr) =>
                  prev.confidence > curr.confidence ? prev : curr
                )
              : null;
        });

        setDetections(results);
        setBestByCategory(best);
        setIsDetecting(false);

        if (canvasRef.current) {
          yoloDetector.drawDetections(canvasRef.current, imageElement, results);
        }

        // auto-select if only one category has detections
        const detectedCategories = Object.keys(best).filter((k) => best[k]);
        if (detectedCategories.length === 1) {
          setTimeout(() => {
            handleCategorySelect(detectedCategories[0]);
          }, 500);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Detection error:", err);
          setError(err instanceof Error ? err.message : "Detection failed");
          setIsDetecting(false);
        }
      }
    };

    detect();

    return () => {
      cancelled = true;
    };
  }, [imageElement]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const detection = bestByCategory[category];
    if (detection && imageElement) {
      const cropped = yoloDetector.cropToBbox(
        imageElement,
        detection.bbox,
        0.05
      );
      setCroppedUrl(cropped);
    }
  };

  const handleConfirm = () => {
    if (selectedCategory && croppedUrl) {
      onNext(selectedCategory, croppedUrl);
    }
  };

  if (isDetecting) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Card padding="xl" className="text-center max-w-2xl w-full">
          <div className="flex justify-center mb-6 animate-float">
            <Search className="w-24 h-24 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-headline font-bold mb-2">
            Detecting clothing items...
          </h2>
          <p className="text-neutral-medium">
            Using AI to find items in your photo
          </p>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Card padding="xl" className="text-center max-w-2xl w-full">
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8 min-h-screen">
      <div className="mb-8 text-center">
        <h2 className="text-headline font-bold mb-3">
          Select <strong className="text-primary">Category</strong>
        </h2>
        <p className="text-lg text-neutral-medium">
          Found items in your photo
        </p>
      </div>

      {imageElement && canvasRef.current && (
        <Card padding="md" className="mb-6">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto rounded-2xl"
            style={{ maxHeight: "400px" }}
          />
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(CATEGORY_MAP).map(([key, { icon: IconComponent, label }]) => {
          const detection = bestByCategory[key];
          const isSelected = selectedCategory === key;
          const hasDetection = detection !== null;

          return (
            <Card
              key={key}
              padding="md"
              hover
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-2 border-primary bg-primary-light"
                  : hasDetection
                  ? "border border-neutral-medium/30"
                  : "border border-neutral-medium/20 opacity-50"
              }`}
              onClick={() => hasDetection && handleCategorySelect(key)}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${
                  isSelected ? "bg-primary" : "bg-primary-light"
                }`}>
                  <IconComponent className={`w-8 h-8 ${
                    isSelected ? "text-white" : "text-primary"
                  }`} strokeWidth={2} />
                </div>
                <p className="font-semibold text-ink mb-1">{label}</p>
                {hasDetection ? (
                  <p className="text-xs text-neutral-medium">
                    {(detection!.confidence * 100).toFixed(0)}% confidence
                  </p>
                ) : (
                  <p className="text-xs text-neutral-medium">Not detected</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedCategory && croppedUrl && (
        <div className="mb-6">
          <Card padding="md">
            <h3 className="font-semibold text-ink mb-3">Preview:</h3>
            <img
              src={croppedUrl}
              alt="Cropped preview"
              className="max-w-full max-h-64 object-contain rounded-xl"
            />
          </Card>
        </div>
      )}

      <Button
        variant="primary"
        fullWidth
        onClick={handleConfirm}
        disabled={!selectedCategory || !croppedUrl}
        className="text-lg py-4"
      >
        Confirm & Continue
      </Button>
    </Container>
  );
}
