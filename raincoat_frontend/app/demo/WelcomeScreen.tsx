import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Umbrella } from 'lucide-react';
import onnxProcessor from '@/lib/onnx-processor';

interface WelcomeScreenProps {
  onNext: () => void;
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const handleStartDemo = () => {
    // Note: Model preloading is now handled lazily on-demand within onnxProcessor
    // On iOS/mobile devices, preloading all models at once (503MB) can exceed
    // the ~512MB WASM heap limit and cause crashes. Models are now loaded
    // individually only when needed.
    //
    // On desktop, preloadModels() is safe but also deprecated in favor of lazy loading.
    // The processor will handle loading efficiently based on device capabilities.
    console.log('[Demo] Models will load on-demand during processing (iOS-optimized lazy loading)');

    onNext();
  };

  return (
    <Container className="flex items-center justify-center min-h-screen">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <Umbrella className="w-24 h-24 text-primary animate-float" strokeWidth={1.5} />
          </div>
          <h1 className="text-hero font-bold mb-4">
            Raincoat
          </h1>
          <p className="text-eyebrow mb-2">Weather-Smart Wardrobe</p>
        </div>

        {/* Hero Content */}
        <h2 className="text-headline font-bold mb-6 leading-tight">
          Smart outfits.<br />
          <strong className="text-primary">Zero privacy compromise.</strong>
        </h2>

        <p className="text-lg text-neutral-medium mb-10 leading-relaxed max-w-xl mx-auto">
          AI-powered outfit recommendations that respect your privacy. All processing happens on your device—your photos never leave your phone.
        </p>

        {/* CTA Button */}
        <div className="space-y-4">
          <Button variant="primary" fullWidth onClick={handleStartDemo} className="text-lg py-4">
            Start Demo
          </Button>
          <p className="text-sm text-neutral-medium opacity-70">
            Experience a 3-minute demo of smart outfit planning
          </p>
        </div>
      </Card>
    </Container>
  );
}
