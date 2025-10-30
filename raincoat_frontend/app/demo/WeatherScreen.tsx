'use client';

import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Card from '@/components/Card';

interface WeatherScreenProps {
  location: { city: string; country: string };
  onNext: () => void;
}

// Mock weather data for demo
const mockWeatherData = {
  temperature: 68,
  condition: 'Partly Cloudy',
  icon: '🌤️',
  details: 'Light breeze, low humidity',
};

export default function WeatherScreen({ location, onNext }: WeatherScreenProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Auto-advance after showing weather
      setTimeout(() => {
        onNext();
      }, 2500);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onNext]);

  if (isLoading) {
    return (
      <Container className="flex items-center justify-center">
        <Card padding="lg" className="text-center max-w-xl">
          <div className="text-6xl mb-6 animate-float">☁️</div>
          <h2 className="text-2xl font-medium text-neutral-dark mb-2">
            Fetching weather data...
          </h2>
          <p className="text-neutral-medium">
            {location.city}, {location.country}
          </p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Location */}
        <p className="text-lg text-neutral-medium mb-4">
          {location.city}, {location.country}
        </p>

        {/* Weather Icon */}
        <div className="text-8xl mb-4 animate-float">{mockWeatherData.icon}</div>

        {/* Temperature */}
        <h2 className="text-6xl font-bold text-neutral-dark mb-2">
          {mockWeatherData.temperature}°F
        </h2>

        {/* Condition */}
        <p className="text-2xl text-neutral-medium mb-4">
          {mockWeatherData.condition}
        </p>

        {/* Additional Details */}
        <p className="text-base text-neutral-medium mb-6">
          {mockWeatherData.details}
        </p>

        {/* Loading Indicator for Next Step */}
        <div className="flex items-center justify-center gap-2 text-accent-info">
          <div className="w-2 h-2 bg-accent-info rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-accent-info rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-accent-info rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          <p className="text-sm ml-2">Finding perfect outfits...</p>
        </div>
      </Card>
    </Container>
  );
}
