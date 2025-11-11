'use client';

import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Card from '@/components/Card';
import { WiDaySunny, WiCloudy, WiDayCloudy, WiRain, WiSnow, WiThunderstorm, WiFog, WiDaySunnyOvercast } from 'weather-icons-react';
import apiClient from '@/lib/api';

interface WeatherScreenProps {
  location: { city: string; country: string };
  onNext: (weather: {
    temperature_c: number;
    temperature_f: number;
    condition_text: string;
    humidity?: number;
    precipitation_mm?: number;
  }) => void;
}

interface WeatherData {
  temperature: number;
  condition: string;
  iconComponent: React.ComponentType<{ size?: number; color?: string }>;
  details: string;
}

// Fallback weather data
const fallbackWeatherData: WeatherData = {
  temperature: 68,
  condition: 'Partly Cloudy',
  iconComponent: WiDayCloudy,
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
        const response = await apiClient.getCurrentWeather(location.city, location.country);

        if (response.success && response.data) {
          console.log('Weather data received:', response.data);

          // Handle the actual API response format
          const weatherSnapshot = response.data.weather;

          // Support both new format (weather snapshot) and legacy format
          const conditionText = weatherSnapshot?.condition_text || response.data.condition || '';
          const temperatureF = weatherSnapshot?.temperature_f || response.data.temperature || 68;
          const temperatureC = weatherSnapshot?.temperature_c || ((temperatureF - 32) * 5) / 9;
          const humidity = weatherSnapshot?.humidity || response.data.humidity;
          const windKph = weatherSnapshot?.wind_kph || response.data.wind_speed;
          const precipitationMm = weatherSnapshot?.precipitation_mm || 0;

          const iconComponent = getWeatherIcon(conditionText);
          const temperature = temperatureF;
          const condition = conditionText || 'Partly Cloudy';

          // Build details string
          const details = [
            humidity ? `Humidity: ${humidity}%` : null,
            windKph ? `Wind: ${windKph} km/h` : null,
          ]
            .filter(Boolean)
            .join(', ') || 'Light breeze, low humidity';

          setWeatherData({
            temperature,
            condition,
            iconComponent,
            details,
          });

          // Pass weather data to next screen after delay
          setTimeout(() => {
            onNext({
              temperature_c: temperatureC,
              temperature_f: temperatureF,
              condition_text: condition,
              humidity,
              precipitation_mm: precipitationMm,
            });
          }, 2500);
        } else {
          console.warn('Weather API returned no data, using fallback');
          setError('Using demo weather data');

          // Pass fallback weather data
          setTimeout(() => {
            onNext({
              temperature_c: 20,
              temperature_f: 68,
              condition_text: 'Partly Cloudy',
              humidity: 50,
              precipitation_mm: 0,
            });
          }, 2500);
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
        setError('Using demo weather data');

        // Pass fallback weather data
        setTimeout(() => {
          onNext({
            temperature_c: 20,
            temperature_f: 68,
            condition_text: 'Partly Cloudy',
            humidity: 50,
            precipitation_mm: 0,
          });
        }, 2500);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [location, onNext]);

  // Helper to get weather icon component based on condition
  const getWeatherIcon = (condition: string): React.ComponentType<{ size?: number; color?: string }> => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) return WiDaySunny;
    if (lowerCondition.includes('cloud') && !lowerCondition.includes('partly')) return WiCloudy;
    if (lowerCondition.includes('partly')) return WiDayCloudy;
    if (lowerCondition.includes('rain') && !lowerCondition.includes('storm')) return WiRain;
    if (lowerCondition.includes('snow')) return WiSnow;
    if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) return WiThunderstorm;
    if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) return WiFog;
    return WiDaySunnyOvercast; // default
  };

  const LoadingIcon = WiDayCloudy;

  if (isLoading) {
    return (
      <Container className="flex items-center justify-center min-h-screen">
        <Card padding="xl" className="text-center max-w-xl w-full">
          <div className="flex justify-center mb-6 animate-float">
            <LoadingIcon size={96} color="#8bb8e8" />
          </div>
          <h2 className="text-headline font-bold mb-2">
            Fetching weather data...
          </h2>
          <p className="text-neutral-medium">
            {location.city}, {location.country}
          </p>
        </Card>
      </Container>
    );
  }

  const WeatherIcon = weatherData.iconComponent;

  return (
    <Container className="flex items-center justify-center min-h-screen">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Error indicator if using fallback */}
        {error && (
          <div className="mb-4 text-xs text-neutral-medium italic">
            {error}
          </div>
        )}

        {/* Location */}
        <p className="text-lg text-neutral-medium mb-6">
          {location.city}, {location.country}
        </p>

        {/* Weather Icon */}
        <div className="flex justify-center mb-6 animate-float">
          <WeatherIcon size={120} color="#8bb8e8" />
        </div>

        {/* Temperature */}
        <h2 className="text-hero font-bold mb-4">
          {weatherData.temperature}°F
        </h2>

        {/* Condition */}
        <p className="text-subhead text-neutral-medium mb-6">
          {weatherData.condition}
        </p>

        {/* Additional Details */}
        <p className="text-base text-neutral-medium mb-8">
          {weatherData.details}
        </p>

        {/* Loading Indicator for Next Step */}
        <div className="flex items-center justify-center gap-2 text-primary">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          <p className="text-sm ml-2 text-primary">Finding perfect outfits...</p>
        </div>
      </Card>
    </Container>
  );
}
