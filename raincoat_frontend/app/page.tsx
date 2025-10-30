'use client';

import { useState } from 'react';
import WelcomeScreen from './demo/WelcomeScreen';
import PrivacyScreen from './demo/PrivacyScreen';
import AddItemScreen from './demo/AddItemScreen';
import CategoryScreen from './demo/CategoryScreen';
import ProcessingScreen from './demo/ProcessingScreen';
import TagsScreen from './demo/TagsScreen';
import ClosetScreen from './demo/ClosetScreen';
import LocationScreen from './demo/LocationScreen';
import WeatherScreen from './demo/WeatherScreen';
import RecommendationsScreen from './demo/RecommendationsScreen';
import CompleteScreen from './demo/CompleteScreen';

export type DemoStep =
  | 'welcome'
  | 'privacy'
  | 'add-item'
  | 'category'
  | 'processing'
  | 'tags'
  | 'closet'
  | 'location'
  | 'weather'
  | 'recommendations'
  | 'complete';

export interface ClothingItem {
  id?: number;
  image: string;
  category: string;
  tags: string[];
  embedding?: number[];
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<DemoStep>('welcome');
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ClothingItem | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const nextStep = () => {
    const steps: DemoStep[] = [
      'welcome',
      'privacy',
      'add-item',
      'category',
      'processing',
      'tags',
      'closet',
      'location',
      'weather',
      'recommendations',
      'complete',
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToStep = (step: DemoStep) => {
    setCurrentStep(step);
  };

  const addItemToCloset = (item: ClothingItem) => {
    setClosetItems([...closetItems, item]);
    setCurrentItem(null);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen onNext={nextStep} />;

      case 'privacy':
        return <PrivacyScreen onNext={nextStep} />;

      case 'add-item':
        return (
          <AddItemScreen
            onNext={(file) => {
              setCurrentItem({ image: URL.createObjectURL(file), category: '', tags: [] });
              nextStep();
            }}
          />
        );

      case 'category':
        return (
          <CategoryScreen
            onNext={(category) => {
              if (currentItem) {
                setCurrentItem({ ...currentItem, category });
              }
              nextStep();
            }}
          />
        );

      case 'processing':
        return (
          <ProcessingScreen
            imageFile={currentItem?.image || ''}
            onComplete={(result) => {
              if (currentItem) {
                setCurrentItem({
                  ...currentItem,
                  tags: result.tags,
                  embedding: result.embedding,
                });
              }
              nextStep();
            }}
          />
        );

      case 'tags':
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

      case 'closet':
        return (
          <ClosetScreen
            items={closetItems}
            onNext={nextStep}
            onAddMore={() => goToStep('add-item')}
          />
        );

      case 'location':
        return (
          <LocationScreen
            onNext={(location) => {
              setSelectedLocation(location);
              nextStep();
            }}
          />
        );

      case 'weather':
        return (
          <WeatherScreen
            location={selectedLocation}
            onNext={nextStep}
          />
        );

      case 'recommendations':
        return (
          <RecommendationsScreen
            items={closetItems}
            location={selectedLocation}
            onNext={nextStep}
          />
        );

      case 'complete':
        return (
          <CompleteScreen
            onRestart={() => {
              setCurrentStep('welcome');
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
