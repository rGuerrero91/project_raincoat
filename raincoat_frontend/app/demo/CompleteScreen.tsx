import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Umbrella, Sparkles, Lock } from 'lucide-react';

interface CompleteScreenProps {
  onRestart: () => void;
}

const featuresExperienced = [
  'Privacy-first photo processing',
  'AI-powered auto-tagging',
  'Weather-based recommendations',
  'Smart outfit creation',
  'Closet organization',
];

export default function CompleteScreen({ onRestart }: CompleteScreenProps) {
  return (
    <Container className="flex items-center justify-center min-h-screen">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Success Icon with Animation */}
        <div className="flex justify-center mb-8 gap-4">
          <Umbrella className="w-24 h-24 text-primary animate-float" strokeWidth={1.5} />
          <Sparkles className="w-20 h-20 text-primary animate-float" style={{ animationDelay: '0.3s' }} strokeWidth={1.5} />
        </div>

        {/* Headline */}
        <h2 className="text-headline font-bold mb-4">
          That's a <strong className="text-primary">Raincoat!</strong>
        </h2>

        <p className="text-lg text-neutral-medium mb-10 leading-relaxed">
          You've experienced the future of weather-smart outfit planning
        </p>

        {/* Features Checklist */}
        <div className="bg-neutral-light rounded-3xl p-8 mb-10 text-left">
          <p className="font-semibold text-ink text-lg mb-6">
            What you experienced:
          </p>
          <div className="space-y-4">
            {featuresExperienced.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-ink leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button variant="primary" fullWidth onClick={onRestart} className="text-lg py-4">
            Restart Demo
          </Button>

          <Button variant="tertiary" fullWidth>
            Learn More
          </Button>
        </div>

        {/* Footer Message */}
        <div className="mt-10 p-6 bg-primary-light rounded-2xl">
          <p className="text-sm text-primary font-semibold flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Remember: Your photos never leave your device</span>
          </p>
        </div>

        {/* Optional Confetti Effect Placeholder */}
        <p className="text-xs text-neutral-medium mt-8 opacity-70">
          Built for weather-conscious fashion lovers who value privacy
        </p>
      </Card>
    </Container>
  );
}
