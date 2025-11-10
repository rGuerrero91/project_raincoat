import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Lock, Smartphone, Tag, Shield, Download } from 'lucide-react';

interface PrivacyScreenProps {
  onNext: () => void;
}

declare global {
  interface Window {
    modelCache?: {
      initialize(): Promise<void>;
      loadONNXModel(url: string): Promise<ArrayBuffer>;
      loadJSON(url: string): Promise<any>;
      getStats(): Promise<{ models: number; json: number; total: number }>;
      clearCache(): Promise<void>;
    };
  }
}

export default function PrivacyScreen({ onNext }: PrivacyScreenProps) {
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    // Check if models are still loading
    const checkInterval = setInterval(() => {
      if (window.modelCache) {
        // console.log(window.modelCache.getStats());
        setIsPreloading(false);
      }
    }, 1000);

    // Auto-hide after 10 seconds (models should be loaded by then)
    const timeout = setTimeout(() => {
      setIsPreloading(false);
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, []);

  const features = [
    {
      icon: Lock,
      title: 'AI processes everything locally',
      description: 'All image processing happens on your device with ONNX Runtime Web',
    },
    {
      icon: Smartphone,
      title: 'Photos never leave your phone',
      description: 'Your images stay private and secure—we never see them',
    },
    {
      icon: Tag,
      title: 'Only anonymized data sent',
      description: 'We only receive text tags and AI embeddings, never your photos',
    },
  ];

  return (
    <Container className="flex items-center justify-center min-h-screen">
      <Card padding="xl" className="text-center max-w-2xl w-full">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <Shield className="w-20 h-20 text-primary" strokeWidth={1.5} />
        </div>

        {/* Headline */}
        <h2 className="text-headline font-bold mb-4">
          Your photos stay <strong className="text-primary">private</strong>
        </h2>

        <p className="text-lg text-neutral-medium mb-10 leading-relaxed">
          Raincoat runs background removal, detection, and embedding generation in-browser with ONNX Runtime Web and WebGPU where available.
        </p>

        {/* Features List */}
        <div className="space-y-6 my-10 text-left">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-light transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-primary" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-ink text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Model Preloading Indicator */}
        {isPreloading && (
          <div className="mb-6 p-4 bg-primary-light/50 rounded-2xl border-2 border-primary/20">
            <div className="flex items-center justify-center gap-3">
              <Download className="w-5 h-5 text-primary animate-bounce" />
              <p className="text-sm text-primary font-medium">
                Preparing AI models in the background...
              </p>
            </div>
          </div>
        )}

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
