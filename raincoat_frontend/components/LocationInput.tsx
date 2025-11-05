import { Button } from './ui/button';
import { Input } from './ui/input';
import { MapPin, Info } from 'lucide-react';
import { useState } from 'react';

interface LocationInputProps {
  onSubmit: (location: string) => void;
}

export default function LocationInput({ onSubmit }: LocationInputProps) {
  const [city, setCity] = useState('');

  const popularCities = ['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Seattle'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#e3f2fd] rounded-full">
            <MapPin className="w-10 h-10 text-[#1976d2]" />
          </div>
          
          <h1 className="text-[#212121]">What's the weather like?</h1>
          
          <p className="text-[#757575]">
            Select your city so we can give you outfit ideas depending on the weather.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter your city"
            className="h-12"
            onKeyPress={(e) => e.key === 'Enter' && city && onSubmit(city)}
          />

          <div className="space-y-2">
            <p className="text-[#757575] text-sm">Popular cities:</p>
            <div className="flex flex-wrap gap-2">
              {popularCities.map((popularCity) => (
                <Button
                  key={popularCity}
                  onClick={() => onSubmit(popularCity)}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  {popularCity}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#e3f2fd] rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-[#1976d2] flex-shrink-0 mt-0.5" />
          <p className="text-[#757575] text-sm">
            We only need the city, nothing specific since we aren't selling your data.
          </p>
        </div>

        <Button
          onClick={() => city && onSubmit(city)}
          disabled={!city}
          size="lg"
          className="w-full bg-[#1976d2] hover:bg-[#1565c0] text-white"
        >
          Set City
        </Button>
      </div>
    </div>
  );
}
