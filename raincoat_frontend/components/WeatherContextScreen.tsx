import { useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind } from 'lucide-react';
import type { WeatherData } from '../App';

interface WeatherContextScreenProps {
  weather: WeatherData | null;
  onComplete: () => void;
}

export default function WeatherContextScreen({ weather, onComplete }: WeatherContextScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!weather) return null;

  const getWeatherIcon = () => {
    const condition = weather.condition.toLowerCase();
    if (condition.includes('sunny')) return Sun;
    if (condition.includes('rain')) return CloudRain;
    if (condition.includes('cloud')) return Cloud;
    return Sun;
  };

  const WeatherIcon = getWeatherIcon();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#e3f2fd] to-[#e1f5e1]">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg">
            <WeatherIcon className="w-16 h-16 text-[#1976d2]" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-[#212121]">{weather.city}</h1>
            <div className="text-6xl text-[#212121]">{weather.temp}°F</div>
            <p className="text-[#757575] text-xl">{weather.condition}</p>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur rounded-2xl p-6">
          <div className="flex items-center justify-center gap-2 text-[#757575]">
            <Wind className="w-5 h-5" />
            <p>{weather.details}</p>
          </div>
        </div>

        <div className="animate-pulse">
          <p className="text-[#1976d2]">Finding perfect outfits...</p>
        </div>
      </div>
    </div>
  );
}
