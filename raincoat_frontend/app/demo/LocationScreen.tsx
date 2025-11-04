'use client';

import { useState } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Globe } from 'lucide-react';
import { WiDaySunnyOvercast } from 'weather-icons-react';

interface LocationScreenProps {
  onNext: (location: { city: string; country: string; latitude: number; longitude: number }) => void;
}

// Mock locations for demo
const demoLocations = [
  { city: 'San Francisco', country: 'United States', latitude: 37.7749, longitude: -122.4194 },
  { city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060 },
  { city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
];

export default function LocationScreen({ onNext }: LocationScreenProps) {
  const [selectedLocation, setSelectedLocation] = useState(demoLocations[0]);
  const [customCity, setCustomCity] = useState('');

  const handleNext = () => {
    onNext(selectedLocation);
  };

  return (
    <Container className="flex items-center justify-center min-h-screen">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <Globe className="w-20 h-20 text-primary" strokeWidth={1.5} />
        </div>

        {/* Headline */}
        <h2 className="text-headline font-bold mb-4">
          What's the weather <strong className="text-primary">like?</strong>
        </h2>

        {/* Body Text */}
        <p className="text-lg text-neutral-medium mb-2 leading-relaxed">
          Select your city so we can give you outfit ideas depending on the weather.
        </p>

        <p className="text-sm text-neutral-medium mb-8 opacity-75">
          We only need the city, nothing specific since we aren't selling your data.
        </p>

        {/* Location Selection */}
        <div className="space-y-3 mb-6">
          {demoLocations.map((location, index) => (
            <button
              key={index}
              onClick={() => setSelectedLocation(location)}
              className={`
                w-full p-4 rounded-2xl border-2 transition-all text-left
                ${
                  selectedLocation === location
                    ? 'border-primary bg-primary-light shadow-soft'
                    : 'border-neutral-medium/30 bg-white hover:border-primary/50'
                }
              `}
            >
              <p className="font-semibold text-ink">
                {location.city}
              </p>
              <p className="text-sm text-neutral-medium">{location.country}</p>
            </button>
          ))}
        </div>

        {/* Custom City Input */}
        <div className="mb-6">
          <p className="text-sm text-neutral-medium mb-2">Or enter a city:</p>
          <input
            type="text"
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            placeholder="e.g., Paris, France"
            className="w-full px-5 py-3 border-2 border-neutral-medium/30 rounded-full focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="primary" fullWidth onClick={handleNext}>
            Set City
          </Button>

          <Button variant="tertiary" fullWidth>
            Skip for now
          </Button>
        </div>

        {/* Weather Icon Example */}
        <div className="mt-8 p-5 bg-primary-light rounded-2xl">
          <div className="flex items-center justify-center gap-3">
            <WiDaySunnyOvercast size={32} color="#8bb8e8" />
            <p className="text-sm text-ink">
              Example: San Francisco, 68°F
            </p>
          </div>
        </div>
      </Card>
    </Container>
  );
}
