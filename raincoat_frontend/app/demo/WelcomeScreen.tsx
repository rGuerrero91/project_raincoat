import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface WelcomeScreenProps {
  onNext: () => void;
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <Container className="flex items-center justify-center min-h-screen">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Logo */}
        <div className="mb-8">
          <div className="text-7xl mb-6 animate-float">☂️</div>
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
          <Button variant="primary" fullWidth onClick={onNext} className="text-lg py-4">
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
