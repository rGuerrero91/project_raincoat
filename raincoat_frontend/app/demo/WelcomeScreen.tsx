import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Umbrella, AlertCircle, Wifi, HardDrive, Smartphone } from 'lucide-react';
import onnxProcessor from '@/lib/onnx-processor';
import { useState, useEffect } from 'react';

interface WelcomeScreenProps {
  onNext: () => void;
}

// Detect if user is on mobile device
function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detect if user is on iOS device
function isIOSDevice(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    // Check if user has already consented in this session
    const consent = sessionStorage.getItem('raincoat-demo-consent');
    if (consent === 'true') {
      setHasConsented(true);
    }

    // Start intelligent idle predownload of models
    // This will only run on devices with sufficient memory and storage
    // Models are downloaded during browser idle time to avoid impacting UX
    onnxProcessor.predownloadModelsWhenIdle();
  }, []);

  const handleStartDemo = () => {
    // Note: Model preloading is now handled lazily on-demand within onnxProcessor
    // On iOS/mobile devices, preloading all models at once (503MB) can exceed
    // the ~512MB WASM heap limit and cause crashes. Models are now loaded
    // individually only when needed.
    //
    // On desktop, preloadModels() is safe but also deprecated in favor of lazy loading.
    // The processor will handle loading efficiently based on device capabilities.
    console.log('[Demo] Models will load on-demand during processing (iOS-optimized lazy loading)');

    // Show consent modal for mobile users who haven't consented yet
    if (isMobileDevice() && !hasConsented) {
      setShowConsentModal(true);
    } else {
      onNext();
    }
  };

  const handleConsent = () => {
    // Store consent in sessionStorage
    sessionStorage.setItem('raincoat-demo-consent', 'true');
    setHasConsented(true);
    setShowConsentModal(false);
    onNext();
  };

  const handleDecline = () => {
    setShowConsentModal(false);
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

      {/* Mobile Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card padding="lg" className="max-w-md w-full">
            <div className="text-center mb-6">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Data Usage Notice</h3>
            </div>

            <div className="space-y-4 text-left mb-6">
              {/* iOS-specific warning */}
              {isIOSDevice() && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <Smartphone className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900">iPhone/iPad Notice</p>
                    <p className="text-sm text-amber-800">
                      This demo is currently experiencing compatibility issues on iOS devices.
                      You may encounter crashes or performance problems. For the best experience,
                      please use a desktop browser or Android device.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <HardDrive className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Storage Required</p>
                  <p className="text-sm text-neutral-medium">AI models require ~500MB of storage space on your device.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Wifi className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Data Download</p>
                  <p className="text-sm text-neutral-medium">We recommend using WiFi to avoid mobile data charges. Models download once and are cached for future use.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Umbrella className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Privacy First</p>
                  <p className="text-sm text-neutral-medium">All processing happens locally on your device. Your photos never leave your phone.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="primary" fullWidth onClick={handleConsent}>
                Continue with Demo
              </Button>
              <Button variant="secondary" fullWidth onClick={handleDecline}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
