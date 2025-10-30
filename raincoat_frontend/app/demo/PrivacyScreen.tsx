import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface PrivacyScreenProps {
  onNext: () => void;
}

export default function PrivacyScreen({ onNext }: PrivacyScreenProps) {
  const features = [
    {
      icon: '🔒',
      title: 'AI processes everything locally',
      description: 'All image processing happens on your device',
    },
    {
      icon: '📱',
      title: 'Photos never leave your phone',
      description: 'Your images stay private and secure',
    },
    {
      icon: '🏷️',
      title: 'Only text (tags) and AI metadata sent to cloud',
      description: 'We never see your actual photos',
    },
  ];

  return (
    <Container className="flex items-center justify-center">
      <Card padding="lg" className="text-center max-w-xl">
        {/* Icon */}
        <div className="text-6xl mb-6">🛡️</div>

        {/* Headline */}
        <h2 className="text-3xl font-medium text-neutral-dark mb-4">
          Your Photos Stay on Your Device
        </h2>

        {/* Features List */}
        <div className="space-y-6 my-8 text-left">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">{feature.icon}</div>
              <div>
                <h3 className="font-semibold text-neutral-dark mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-medium">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button variant="primary" fullWidth onClick={onNext}>
          Got It
        </Button>

        {/* Learn More Link */}
        <button className="btn-tertiary mt-4 w-full">
          Learn More About Privacy
        </button>
      </Card>
    </Container>
  );
}
