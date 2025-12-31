'use client';

import { useState } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Globe } from 'lucide-react';
import { WiDaySunnyOvercast } from 'weather-icons-react';
import apiClient from '@/lib/api';

interface LocationScreenProps {
  onNext: (location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    id?: number;
  }) => void;
}

// Mock locations for demo
const demoLocations = [
  { city: 'San Francisco', country: 'United States', latitude: 37.7749, longitude: -122.4194 },
  { city: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006 },
  { city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
];

export default function LocationScreen({ onNext }: LocationScreenProps) {
  const [selectedLocation, setSelectedLocation] = useState(demoLocations[0]);
  const [customCity, setCustomCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchCity = async (query: string) => {
    setCustomCity(query);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for location:', query);
      const response = await apiClient.searchLocation(query);

      if (response.success && response.data) {
        const results = Array.isArray(response.data) ? response.data : [];
        console.log('Search results:', results);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching location:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    setSelectedLocation({
      city: result.name || result.city,
      country: result.country,
      latitude: result.lat || result.latitude,
      longitude: result.lon || result.longitude,
    });
    setCustomCity('');
    setSearchResults([]);
  };

  const handleNext = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating location in backend...', selectedLocation);

      // Create location in backend
      const response = await apiClient.createLocation({
        name: `${selectedLocation.city}, ${selectedLocation.country}`,
        city: selectedLocation.city,
        country: selectedLocation.country,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        is_default: true, // Set as default location
      });

      if (response.success && response.data) {
        console.log('Location created successfully:', response.data);

        // Pass location with backend ID to next screen
        const locationData = response.data as any;
        onNext({
          ...selectedLocation,
          id: locationData.id,
        });
      } else {
        console.warn('Failed to create location in backend:', response.error);
        setError('Failed to set location. Using demo mode.');

        // Continue with demo mode after 1 second
        setTimeout(() => {
          onNext(selectedLocation);
        }, 1000);
      }
    } catch (err) {
      console.error('Error creating location:', err);
      setError('Failed to connect to server. Using demo mode.');

      // Continue with demo mode after 1 second
      setTimeout(() => {
        onNext(selectedLocation);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
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
          What&apos;s the weather <strong className="text-primary">like?</strong>
        </h2>

        {/* Body Text */}
        <p className="text-lg text-neutral-medium mb-2 leading-relaxed">
          Select your city so we can give you outfit ideas depending on the weather.
        </p>

        <p className="text-sm text-neutral-medium mb-8 opacity-75">
          We only need the city, nothing specific since we aren&apos;t selling your data.
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
              <p className="font-semibold text-ink">{location.city}</p>
              <p className="text-sm text-neutral-medium">{location.country}</p>
            </button>
          ))}
        </div>

        {/* Custom City Input */}
        <div className="mb-6 relative">
          <p className="text-sm text-neutral-medium mb-2">Or search for a city:</p>
          <input
            type="text"
            value={customCity}
            onChange={e => handleSearchCity(e.target.value)}
            placeholder="e.g., Paris, France"
            className="w-full px-5 py-3 border-2 border-neutral-medium/30 rounded-full focus:border-primary focus:outline-none transition-colors"
          />

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border-2 border-neutral-medium/30 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full p-3 text-left hover:bg-primary-light transition-colors border-b border-neutral-medium/20 last:border-b-0"
                >
                  <p className="font-semibold text-ink">{result.name || result.city}</p>
                  <p className="text-sm text-neutral-medium">
                    {result.region && `${result.region}, `}
                    {result.country}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Searching Indicator */}
          {isSearching && (
            <div className="absolute right-4 top-11 text-sm text-neutral-medium">Searching...</div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="primary" fullWidth onClick={handleNext} disabled={isLoading}>
            {isLoading ? 'Setting location...' : 'Set City'}
          </Button>

          <Button
            variant="tertiary"
            fullWidth
            onClick={() => onNext(selectedLocation)}
            disabled={isLoading}
          >
            Skip for now
          </Button>
        </div>

        {/* Weather Icon Example */}
        <div className="mt-8 p-5 bg-primary-light rounded-2xl">
          <div className="flex items-center justify-center gap-3">
            <WiDaySunnyOvercast size={32} color="#8bb8e8" />
            <p className="text-sm text-ink">Example: San Francisco, 68°F</p>
          </div>
        </div>
      </Card>
    </Container>
  );
}
