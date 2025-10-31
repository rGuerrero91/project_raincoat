"use client";

import { useEffect, useRef, useState } from "react";
import Container from "@/components/Container";
import Button from "@/components/Button";
import Card from "@/components/Card";
import yoloDetector, { type YOLODetection } from "@/lib/yolo-detector";

interface ObjectDetectionAndCategoryScreenProps {
  imageFile: File;
  onNext: (category: string, croppedImageUrl: string) => void;
}

const CATEGORY_MAP: Record<string, { icon: string; label: string }> = {
  top: { icon: "👕", label: "Top" },
  bottom: { icon: "👖", label: "Bottom" },
  outerwear: { icon: "🧥", label: "Outerwear" },
  shoes: { icon: "👟", label: "Shoes" },
  accessories: { icon: "🎒", label: "Accessories" },
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
    const load = async () => {
      setIsDetecting(true);
      setError(null);
      try {
        const img = new Image();
        const objectUrl = URL.createObjectURL(imageFile);
        objectUrlRef.current = objectUrl;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
          img.src = objectUrl;
        });

        if (cancelled) {
          if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
          }
          return;
        }

        setImageElement(img);
      } catch (err) {
        console.error("load image error", err);
        setError("Failed to load image");
      } finally {
        // don't flip detecting here — detection effect will manage it
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [imageFile]);

  // run detection when imageElement is ready and canvas present
  useEffect(() => {
    if (!imageElement) return;

    let cancelled = false;
    const canvas = canvasRef.current ?? null;

    const run = async () => {
      setIsDetecting(true);
      setError(null);
      try {
        await yoloDetector.initialize(); // assume idempotent
      } catch (err) {
        console.error("yolo init error", err);
        if (!cancelled) setError("Model initialization failed.");
        setIsDetecting(false);
        return;
      }

      try {
        const results = await yoloDetector.detect(imageElement);
        if (cancelled) return;

        setDetections(results || []);

        // defensive drawing
        if (canvas) {
          try {
            // ensure drawDetections guards against null canvas internally, but we protect here too
            yoloDetector.drawDetections(canvas, imageElement, results || []);
          } catch (drawErr) {
            console.warn("drawDetections failed:", drawErr);
          }
        }

        // compute best by category
        const best: Record<string, YOLODetection | null> = {};
        for (const cat of Object.keys(CATEGORY_MAP)) {
          const dets = (results || []).filter((d) => d.category === cat);
          best[cat] = dets.length
            ? dets.reduce((a, b) => (a.confidence > b.confidence ? a : b))
            : null;
        }
        setBestByCategory(best);

        // auto-select first available category (optional)
        const firstAvailable = Object.keys(best).find((k) => !!best[k]);
        if (firstAvailable && !selectedCategory) {
          // don't automatically set selectedCategory if user already chose
          // instead set cropped preview so UI shows something
          const det = best[firstAvailable]!;
          const preview = yoloDetector.cropToBbox(imageElement, det.bbox, 0.05);
          setCroppedUrl(preview);
        }
      } catch (err) {
        console.error("detection error", err);
        if (!cancelled)
          setError("Detection failed. You can continue manually.");
      } finally {
        if (!cancelled) setIsDetecting(false);
      }
    };

    // tiny delay to ensure DOM painted (rare race)
    const t = window.setTimeout(run, 10);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // intentionally depend only on imageElement; canvasRef is stable
  }, [imageElement]);

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    const det = bestByCategory[category];
    if (!det || !imageElement) {
      setCroppedUrl(null);
      return;
    }
    try {
      const preview = yoloDetector.cropToBbox(imageElement, det.bbox, 0.05);
      setCroppedUrl(preview);
    } catch (err) {
      console.warn("cropToBbox error", err);
      setCroppedUrl(null);
    }
  };

  const handleContinue = () => {
    try {
      const finalImage =
        croppedUrl || objectUrlRef.current || URL.createObjectURL(imageFile);
      const category = selectedCategory || "Unknown";
      onNext(category, finalImage);
    } catch (err) {
      console.error("continue error", err);
      onNext("Unknown", URL.createObjectURL(imageFile));
    }
  };

  // UI

  if (isDetecting) {
    return (
      <Container className="flex items-center justify-center min-h-[60vh]">
        <Card padding="lg" className="text-center">
          <div className="text-5xl mb-4 animate-float">🔍</div>
          <h2 className="text-xl font-semibold text-neutral-dark">
            Detecting clothing...
          </h2>
          <p className="text-neutral-medium">
            This usually takes 2–5 seconds. Found {detections.length} items.
          </p>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card padding="lg" className="text-center">
          <h2 className="text-xl mb-3">Detection Unavailable</h2>
          <p className="text-neutral-medium mb-4">{error}</p>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() =>
                onNext(
                  "Unknown",
                  objectUrlRef.current || URL.createObjectURL(imageFile)
                )
              }
            >
              Continue without detection
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                // allow retry: re-run detection by clearing imageElement so effect reloads
                setError(null);
                setIsDetecting(true);
                setImageElement(null);
                // reload image to retrigger detection effect
                const reload = async () => {
                  const img = new Image();
                  const url = URL.createObjectURL(imageFile);
                  objectUrlRef.current = url;
                  await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = (e) => reject(e);
                    img.src = url;
                  });
                  setImageElement(img);
                };
                reload().catch((e) => {
                  console.error("reload image failed", e);
                  setError("Retry failed");
                  setIsDetecting(false);
                });
              }}
            >
              Retry
            </Button>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8 space-y-6">
      <div className="text-center">
        <h2 className="text-3xl text-white mb-2">Select Clothing Category</h2>
        <p className="text-white/70">
          Tap a category to preview the detected item.
        </p>
      </div>

      <Card>
        {/* canvas: we let drawDetections handle sizing; defensive in yolo-detector */}
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto rounded-md mx-auto"
          style={{ maxHeight: "400px" }}
        />
      </Card>

      {/* Category selection buttons */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {Object.entries(CATEGORY_MAP).map(([key, { icon, label }]) => {
          const hasDetection = !!bestByCategory[key];
          const det = bestByCategory[key];
          const confidence = det ? Math.round(det.confidence * 100) : null;
          return (
            <button
              key={key}
              disabled={!hasDetection}
              onClick={() => handleSelectCategory(key)}
              className={`p-3 rounded-lg transition ${
                selectedCategory === key
                  ? "bg-accent-info text-white"
                  : hasDetection
                    ? "bg-neutral-dark text-white hover:bg-accent-info/60"
                    : "bg-neutral-light text-neutral-medium opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="text-3xl mb-1">{icon}</div>
              <div className="text-xs font-medium">{label}</div>
              {confidence !== null && (
                <div className="text-[10px] mt-1 opacity-80">{confidence}%</div>
              )}
            </button>
          );
        })}
      </div>

      {selectedCategory && croppedUrl && (
        <div className="mt-6 text-center">
          <p className="text-white mb-2">
            Cropped preview for{" "}
            <strong>{CATEGORY_MAP[selectedCategory].label}</strong>
          </p>
          <img
            src={croppedUrl}
            alt="Cropped preview"
            className="mx-auto rounded-md max-h-[300px] border border-neutral-medium"
          />
        </div>
      )}

      <Button
        variant="primary"
        fullWidth
        className="mt-6"
        disabled={!selectedCategory}
        onClick={handleContinue}
      >
        Continue
      </Button>
    </Container>
  );
}
