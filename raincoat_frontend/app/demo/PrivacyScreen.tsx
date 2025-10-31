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
      description: 'All image processing happens on your device with ONNX Runtime Web',
    },
    {
      icon: '📱',
      title: 'Photos never leave your phone',
      description: 'Your images stay private and secure—we never see them',
    },
    {
      icon: '🏷️',
      title: 'Only anonymized data sent',
      description: 'We only receive text tags and AI embeddings, never your photos',
    },
  ];

  return (
    <Container className="flex items-center justify-center min-h-screen">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Icon */}
        <div className="text-7xl mb-8">🛡️</div>

        {/* Headline */}
        <h2 className="text-headline font-bold mb-4">
          Your photos stay <strong className="text-primary">private</strong>
        </h2>

        <p className="text-lg text-neutral-medium mb-10 leading-relaxed">
          Raincoat runs background removal, detection, and embedding generation in-browser with ONNX Runtime Web and WebGPU where available.
        </p>

        {/* Features List */}
        <div className="space-y-6 my-10 text-left">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-light transition-colors"
            >
              <div className="text-5xl flex-shrink-0">{feature.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Button variant="primary" fullWidth onClick={onNext} className="text-lg py-4">
            Got It
          </Button>
          <Button variant="tertiary" fullWidth>
            Learn More About Privacy
          </Button>
        </div>
      </Card>
    </Container>
  );
}
