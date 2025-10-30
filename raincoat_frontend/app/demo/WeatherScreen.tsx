'use client';

import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Card from '@/components/Card';
import apiClient from '@/lib/api';

interface WeatherScreenProps {
  location: { city: string; country: string };
  onNext: () => void;
}

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  details: string;
}

// Fallback weather data
const fallbackWeatherData: WeatherData = {
  temperature: 68,
  condition: 'Partly Cloudy',
  icon: '🌤️',
  details: 'Light breeze, low humidity',
};

export default function WeatherScreen({ location, onNext }: WeatherScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData>(fallbackWeatherData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        console.log('Fetching weather from API...');
        const response = await apiClient.getCurrentWeather();

        if (response.success && response.data) {
          console.log('Weather data received:', response.data);
          // Map API response to our format
          const weatherIcon = getWeatherIcon(response.data.condition);
          setWeatherData({
            temperature: response.data.temperature,
            condition: response.data.condition,
            icon: weatherIcon,
            details: response.data.details || `${response.data.location?.city || location.city}`,
          });
        } else {
          console.warn('Weather API returned no data, using fallback');
          setError('Using demo weather data');
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
        setError('Using demo weather data');
      } finally {
        setIsLoading(false);
        // Auto-advance after showing weather
        setTimeout(() => {
          onNext();
        }, 2500);
      }
    };

    fetchWeather();
  }, [location, onNext]);

  // Helper to get weather emoji based on condition
  const getWeatherIcon = (condition: string): string => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) return '☀️';
    if (lowerCondition.includes('cloud')) return '☁️';
    if (lowerCondition.includes('partly')) return '🌤️';
    if (lowerCondition.includes('rain')) return '🌧️';
    if (lowerCondition.includes('snow')) return '❄️';
    if (lowerCondition.includes('storm')) return '⛈️';
    if (lowerCondition.includes('fog')) return '🌫️';
    return '🌤️'; // default
  };

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
        {/* Error indicator if using fallback */}
        {error && (
          <div className="mb-4 text-xs text-neutral-medium italic">
            {error}
          </div>
        )}

        {/* Location */}
        <p className="text-lg text-neutral-medium mb-4">
          {location.city}, {location.country}
        </p>

        {/* Weather Icon */}
        <div className="text-8xl mb-4 animate-float">{weatherData.icon}</div>

        {/* Temperature */}
        <h2 className="text-6xl font-bold text-neutral-dark mb-2">
          {weatherData.temperature}°F
        </h2>

        {/* Condition */}
        <p className="text-2xl text-neutral-medium mb-4">
          {weatherData.condition}
        </p>

        {/* Additional Details */}
        <p className="text-base text-neutral-medium mb-6">
          {weatherData.details}
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
