'use client';

import { useState } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';

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
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Icon */}
        <div className="text-6xl mb-6">🌍</div>

        {/* Headline */}
        <h2 className="text-3xl font-medium text-neutral-dark mb-3">
          What's the weather like?
        </h2>

        {/* Body Text */}
        <p className="text-base text-neutral-medium mb-2">
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
                w-full p-4 rounded-lg border-2 transition-all text-left
                ${
                  selectedLocation === location
                    ? 'border-accent-info bg-primary-blue shadow-md'
                    : 'border-neutral-medium/30 bg-white hover:border-accent-info'
                }
              `}
            >
              <p className="font-semibold text-neutral-dark">
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
            className="w-full px-4 py-3 border-2 border-neutral-medium/30 rounded-lg focus:border-accent-info focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="primary" fullWidth onClick={handleNext}>
            Set City
          </Button>

          <button className="btn-tertiary w-full">
            Skip for now
          </button>
        </div>

        {/* Weather Icon Example */}
        <div className="mt-6 p-4 bg-primary-blue rounded-lg">
          <p className="text-sm text-neutral-dark">
            🌤️ Example: San Francisco, 68°F
          </p>
        </div>
      </Card>
    </Container>
  );
}
