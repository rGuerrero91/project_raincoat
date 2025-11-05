"use client";
import { useState } from 'react';
import WelcomeScreen from '../components/WelcomeScreen';
import PrivacyPromiseScreen from '../components/PrivacyPromiseScreen';
import AddFirstItemScreen from '../components/AddFirstItemScreen';
import PhotoSourceSelection from '../components/PhotoSourceSelection';
import CategorySelector from '../components/CategorySelector';
import ProcessingScreen from '../components/ProcessingScreen';
import AutoTagsScreen from '../components/AutoTagsScreen';
import EditTagSheet from '../components/EditTagSheet';
import SavingItemScreen from '../components/SavingItemScreen';
import QuickAddItems from '../components/QuickAddItems';
import YourClosetScreen from '../components/YourClosetScreen';
import LocationInput from '../components/LocationInput';
import WeatherContextScreen from '../components/WeatherContextScreen';
import OutfitRecommendations from '../components/OutfitRecommendations';
import OutfitDetailScreen from '../components/OutfitDetailScreen';
import SimilarItemsScreen from '../components/SimilarItemsScreen';
import CollectionsScreen from '../components/CollectionsScreen';
import CollectionDetailScreen from '../components/CollectionDetailScreen';
import DemoCompleteScreen from '../components/DemoCompleteScreen';
import { Toaster } from '../components/ui/sonner';

export interface ClothingItem {
  id: string;
  image: string;
  tags: string[];
  category: string;
  collections?: string[];
}

export interface Outfit {
  id: string;
  name: string;
  items: ClothingItem[];
  reason: string;
  whyItWorks: string[];
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  details: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ClothingItem | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedItemForSimilar, setSelectedItemForSimilar] = useState<ClothingItem | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState(false);

  const screens = [
    <WelcomeScreen onStart={() => setCurrentScreen(1)} />,
    <PrivacyPromiseScreen onContinue={() => setCurrentScreen(2)} />,
    <AddFirstItemScreen onUpload={() => setCurrentScreen(3)} />,
    <PhotoSourceSelection 
      onSelect={(source) => {
        // Simulate photo selection
        setCurrentScreen(4);
      }} 
    />,
    <CategorySelector 
      onSelect={(category) => {
        setCurrentItem({
          id: '1',
          image: '',
          tags: [],
          category: category
        });
        setCurrentScreen(5);
      }}
    />,
    <ProcessingScreen onComplete={() => setCurrentScreen(6)} />,
    <AutoTagsScreen 
      item={currentItem}
      onEdit={() => setEditingTags(true)}
      onConfirm={(tags) => {
        if (currentItem) {
          const newItem = { ...currentItem, tags };
          setClosetItems([...closetItems, newItem]);
          setCurrentScreen(8);
        }
      }}
    />,
    editingTags ? (
      <EditTagSheet 
        item={currentItem}
        onClose={() => setEditingTags(false)}
        onSave={(tags) => {
          if (currentItem) {
            setCurrentItem({ ...currentItem, tags });
          }
          setEditingTags(false);
        }}
      />
    ) : null,
    <SavingItemScreen onComplete={() => setCurrentScreen(9)} />,
    <QuickAddItems 
      onComplete={(items) => {
        setClosetItems([...closetItems, ...items]);
        setCurrentScreen(10);
      }}
    />,
    <YourClosetScreen 
      items={closetItems}
      onGetOutfits={() => setCurrentScreen(11)}
      onAddItem={() => setCurrentScreen(2)}
      onViewCollections={() => setCurrentScreen(16)}
      onItemClick={(item) => {
        setSelectedItemForSimilar(item);
        setCurrentScreen(15);
      }}
    />,
    <LocationInput 
      onSubmit={(location) => {
        setWeatherData({
          city: location,
          temp: 68,
          condition: 'Partly Cloudy',
          details: 'Light breeze, low humidity'
        });
        setCurrentScreen(12);
      }}
    />,
    <WeatherContextScreen 
      weather={weatherData}
      onComplete={() => setCurrentScreen(13)}
    />,
    <OutfitRecommendations 
      weather={weatherData}
      items={closetItems}
      onSelectOutfit={(outfit) => {
        setSelectedOutfit(outfit);
        setCurrentScreen(14);
      }}
    />,
    <OutfitDetailScreen 
      outfit={selectedOutfit}
      onBack={() => setCurrentScreen(13)}
      onFindSimilar={(item) => {
        setSelectedItemForSimilar(item);
        setCurrentScreen(15);
      }}
    />,
    <SimilarItemsScreen 
      originalItem={selectedItemForSimilar}
      items={closetItems}
      onBack={() => setCurrentScreen(14)}
    />,
    <CollectionsScreen 
      items={closetItems}
      onSelectCollection={(collectionName) => {
        setSelectedCollection(collectionName);
        setCurrentScreen(17);
      }}
      onBack={() => setCurrentScreen(10)}
    />,
    <CollectionDetailScreen 
      collectionName={selectedCollection}
      items={closetItems}
      onBack={() => setCurrentScreen(16)}
    />,
    <DemoCompleteScreen 
      onRestart={() => {
        setCurrentScreen(0);
        setClosetItems([]);
        setCurrentItem(null);
        setWeatherData(null);
      }}
    />
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {screens[currentScreen]}
      <Toaster />
    </div>
  );
}
