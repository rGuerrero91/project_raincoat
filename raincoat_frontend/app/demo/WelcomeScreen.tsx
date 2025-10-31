import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface WelcomeScreenProps {
  onNext: () => void;
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Logo */}
        <div className="mb-6">
          <h1 className="text-5xl font-bold text-accent-info mb-2">
            Raincoat
          </h1>
          <div className="text-6xl mb-4">☂️</div>
        </div>

        {/* Hero Content */}
        <h2 className="text-3xl font-medium text-neutral-dark mb-4 leading-tight">
          Your Weather-Smart Wardrobe
        </h2>

        <p className="text-lg text-neutral-medium mb-8 leading-relaxed">
          AI-powered outfit recommendations that respect your privacy
        </p>

        {/* CTA Button */}
        <Button variant="primary" fullWidth onClick={onNext}>
          Start Demo
        </Button>

        {/* Subtle Description */}
        <p className="text-sm text-neutral-medium mt-6 opacity-75">
          Experience a 3-minute demo of smart outfit planning
        </p>
      </Card>
    </Container>
  );
}
