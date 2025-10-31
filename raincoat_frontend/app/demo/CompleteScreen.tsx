import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';

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
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Success Icon with Animation */}
        <div className="text-8xl mb-6">☂️✨</div>

        {/* Headline */}
        <h2 className="text-4xl font-bold text-neutral-dark mb-4">
          That's a Raincoat!
        </h2>

        <p className="text-lg text-neutral-medium mb-8">
          You've experienced the future of weather-smart outfit planning
        </p>

        {/* Features Checklist */}
        <div className="bg-neutral-light rounded-lg p-6 mb-8 text-left">
          <p className="font-semibold text-neutral-dark mb-4">
            What you experienced:
          </p>
          <div className="space-y-3">
            {featuresExperienced.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-accent-success rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-neutral-dark">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="primary" fullWidth onClick={onRestart}>
            Restart Demo
          </Button>

          <button className="btn-tertiary w-full">
            Learn More
          </button>
        </div>

        {/* Footer Message */}
        <div className="mt-8 p-4 bg-gradient-to-r from-primary-blue to-primary-green rounded-lg">
          <p className="text-sm text-neutral-dark font-medium">
            🔒 Remember: Your photos never leave your device
          </p>
        </div>

        {/* Optional Confetti Effect Placeholder */}
        <p className="text-xs text-neutral-medium mt-6">
          Built for weather-conscious fashion lovers who value privacy
        </p>
      </Card>
    </Container>
  );
}
