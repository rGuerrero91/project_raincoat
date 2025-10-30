"use client";

import { useState } from "react";
import WelcomeScreen from "./demo/WelcomeScreen";
import PrivacyScreen from "./demo/PrivacyScreen";
import AddItemScreen from "./demo/AddItemScreen";
import ObjectDetectionScreen from "./demo/ObjectDetectionScreen";
import CategoryScreen from "./demo/CategoryScreen";
// import ObjectDetectionAndCategoryScreen from "./demo/ObjectDetectionAndCategoryScreen";
import ProcessingScreen from "./demo/ProcessingScreen";
import TagsScreen from "./demo/TagsScreen";
import ClosetScreen from "./demo/ClosetScreen";
import LocationScreen from "./demo/LocationScreen";
import WeatherScreen from "./demo/WeatherScreen";
import RecommendationsScreen from "./demo/RecommendationsScreen";
import CompleteScreen from "./demo/CompleteScreen";
import apiClient from "@/lib/api";

export type DemoStep =
  | "welcome"
  | "privacy"
  | "add-item"
  | "object-detection"
  | "category"
  // | "object-detection-category"
  | "processing"
  | "tags"
  | "closet"
  | "location"
  | "weather"
  | "recommendations"
  | "complete";

export interface ClothingItem {
  id?: number;
  image: string;
  fileObject?: File; // Store original File for ONNX processing
  croppedImage?: string; // YOLO-cropped image URL (before processing)
  processedImage?: string; // Background-removed image URL
  detectedCategory?: string; // YOLO-detected category
  category: string;
  tags: string[];
  embedding?: number[];
  originalImageElement?: HTMLImageElement; // Original image element for re-cropping
  allDetections?: any[]; // All YOLO detections for re-cropping
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<DemoStep>("welcome");
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ClothingItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const nextStep = () => {
    const steps: DemoStep[] = [
      "welcome",
      "privacy",
      "add-item",
      "object-detection",
      "category",
      // "object-detection-category",
      "processing",
      "tags",
      "closet",
      "location",
      "weather",
      "recommendations",
      "complete",
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToStep = (step: DemoStep) => {
    setCurrentStep(step);
  };

  const addItemToCloset = async (item: ClothingItem) => {
    try {
      console.log("Saving item to backend...", item);

      // Create clothing item in backend
      const response = await apiClient.createClothingItem({
        category: item.category,
        ai_tags: item.tags,
        user_tags: item.tags,
      });

      if (response.success && response.data) {
        const savedItem = response.data as any;
        console.log("Item saved with ID:", savedItem.id);

        // Upload embedding if available
        if (item.embedding && savedItem.id) {
          console.log("Uploading embedding...");
          await apiClient.uploadEmbedding(savedItem.id, item.embedding);
        }

        // Update item with backend ID
        const itemWithId = { ...item, id: savedItem.id as number };
        setClosetItems([...closetItems, itemWithId]);
      } else {
        console.warn("Failed to save to backend, adding to local closet only");
        setClosetItems([...closetItems, item]);
      }
    } catch (error) {
      console.error("Error saving item:", error);
      // Still add to local closet even if backend save fails
      setClosetItems([...closetItems, item]);
    }

    setCurrentItem(null);
  };

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return <WelcomeScreen onNext={nextStep} />;

      case "privacy":
        return <PrivacyScreen onNext={nextStep} />;

      case "add-item":
        return (
          <AddItemScreen
            onNext={(file) => {
              setCurrentItem({
                image: URL.createObjectURL(file),
                fileObject: file, // Store File for ONNX processing
                category: "",
                tags: [],
              });
              nextStep();
            }}
          />
        );

      case "object-detection":
        return (
          <ObjectDetectionScreen
            imageFile={currentItem?.fileObject!}
            onDetectionSelected={(
              detection,
              croppedImageUrl,
              originalImage,
              allDetections
            ) => {
              if (currentItem) {
                setCurrentItem({
                  ...currentItem,
                  croppedImage: croppedImageUrl,
                  detectedCategory: detection?.category || "Unknown",
                  originalImageElement: originalImage,
                  allDetections: allDetections,
                });
              }
              nextStep();
            }}
          />
        );

      case "category":
        return (
          <CategoryScreen
            detectedCategory={currentItem?.detectedCategory}
            croppedImageUrl={currentItem?.croppedImage}
            originalImage={currentItem?.originalImageElement}
            allDetections={currentItem?.allDetections}
            onNext={(category, updatedCroppedUrl) => {
              if (currentItem) {
                setCurrentItem({
                  ...currentItem,
                  category,
                  croppedImage: updatedCroppedUrl || currentItem.croppedImage,
                });
              }
              nextStep();
            }}
          />
        );

      // case "object-detection-category":
      //   return (
      //     <ObjectDetectionAndCategoryScreen
      //       imageFile={currentItem?.fileObject!}
      //       onNext={(category, croppedImageUrl) => {
      //         if (currentItem) {
      //           setCurrentItem({
      //             ...currentItem,
      //             category,
      //             croppedImage: croppedImageUrl,
      //           });
      //         }
      //         nextStep();
      //       }}
      //     />
      //   );

      case "processing":
        return (
          <ProcessingScreen
            imageFile={currentItem?.fileObject!}
            croppedImageUrl={currentItem?.croppedImage}
            onComplete={(result) => {
              if (currentItem) {
                setCurrentItem({
                  ...currentItem,
                  tags: result.tags,
                  embedding: result.embedding,
                  processedImage: result.processedImageUrl, // Store processed image
                });
              }
              nextStep();
            }}
          />
        );

      case "tags":
        return (
          <TagsScreen
            item={currentItem!}
            onNext={(updatedTags) => {
              if (currentItem) {
                const finalItem = { ...currentItem, tags: updatedTags };
                addItemToCloset(finalItem);
              }
              nextStep();
            }}
          />
        );

      case "closet":
        return (
          <ClosetScreen
            items={closetItems}
            onNext={nextStep}
            onAddMore={() => goToStep("add-item")}
          />
        );

      case "location":
        return (
          <LocationScreen
            onNext={(location) => {
              setSelectedLocation(location);
              nextStep();
            }}
          />
        );

      case "weather":
        return <WeatherScreen location={selectedLocation} onNext={nextStep} />;

      case "recommendations":
        return (
          <RecommendationsScreen
            items={closetItems}
            location={selectedLocation}
            onNext={nextStep}
          />
        );

      case "complete":
        return (
          <CompleteScreen
            onRestart={() => {
              setCurrentStep("welcome");
              setClosetItems([]);
              setCurrentItem(null);
              setSelectedLocation(null);
            }}
          />
        );

      default:
        return <WelcomeScreen onNext={nextStep} />;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-blue via-primary-green to-primary-amber">
      {renderStep()}
    </main>
  );
}
