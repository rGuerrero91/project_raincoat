import Container from "@/components/Container";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { Plus, ExternalLink } from "lucide-react";
import { ClothingItem } from "./page";
import { useEffect } from "react";
import imageCache from "@/lib/image-cache";

interface ClosetScreenProps {
  items: ClothingItem[];
  onNext: () => void;
  onAddMore: () => void;
}

export default function ClosetScreen({
  items,
  onNext,
  onAddMore,
}: ClosetScreenProps) {
  // Save processed images to cache when items are added
  useEffect(() => {
    const saveImagesToCache = async () => {
      for (const item of items) {
        if (item.id && (item.processedImageBlob || item.processedImage)) {
          try {
            // Check if already cached to avoid redundant saves
            const hasCached = await imageCache.hasImage(item.id);
            if (!hasCached) {
              console.log(`[ClosetScreen] Saving processed image for item ${item.id} to cache`);
              // Use Blob if available (prevents blob URL revocation issues), otherwise fall back to URL
              await imageCache.saveImage(
                item.id,
                item.processedImageBlob || item.processedImage!
              );
            }
          } catch (error) {
            console.warn(`[ClosetScreen] Failed to cache image for item ${item.id}:`, error);
          }
        }
      }
    };

    saveImagesToCache();
  }, [items]);

  return (
    <Container className="py-8 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-headline font-bold mb-3">
          Your <strong className="text-primary">closet</strong>
        </h2>
        <p className="text-lg text-neutral-medium">
          {items.length} {items.length === 1 ? "item" : "items"} added
        </p>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.id ? `demo/items/${item.id}` : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`block ${!item.id ? "pointer-events-none" : ""}`}
          >
            <Card
              padding="sm"
              hover
              className="cursor-pointer h-full relative group"
            >
              {/* External Link Icon */}
              {item.id && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white rounded-full p-1.5 shadow-md">
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </div>
                </div>
              )}

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

              {/* Category Badge */}
              {item.category && (
                <span className="mt-2 text-xs text-medium capitalize">
                  {item.category}-
                </span>
              )}
              <span className="mt-2 text-xs text-neutral-medium capitalize">
                See Similar Items
              </span>
            </Card>
          </a>
        ))}

        {/* Add More Card */}
        <Card
          padding="sm"
          hover
          className="cursor-pointer border-2 border-dashed border-neutral-medium/30 flex items-center justify-center aspect-square transition-all hover:border-primary hover:bg-primary-light/20"
          onClick={onAddMore}
        >
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Plus className="w-12 h-12 text-primary" strokeWidth={2} />
            </div>
            <p className="text-sm font-semibold text-neutral-medium">
              Add Item
            </p>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <Button
          variant="primary"
          fullWidth
          onClick={onNext}
          className="text-lg py-4"
        >
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
