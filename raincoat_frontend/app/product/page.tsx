'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ProductPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const slides = [
    '/demo_screens/Screenshot_20251031-191142.png',
    '/demo_screens/Screenshot_20251031-191151.png',
    '/demo_screens/Screenshot_20251031-191233.png',
    '/demo_screens/Screenshot_20251031-203116.png',
  ];

  const totalSlides = slides.length;

  const startAutoplay = () => {
    autoplayRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 4000);
  };

  const stopAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }
  };

  const resetAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide((index + totalSlides) % totalSlides);
    resetAutoplay();
  };

  const nextSlide = () => {
    goToSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    goToSlide(currentSlide - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.changedTouches[0].screenX);
    stopAutoplay();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].screenX);
    const diff = touchStart - e.changedTouches[0].screenX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    } else {
      startAutoplay();
    }
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #fdfcfb;
          --muted: #8b9199;
          --ink: #4a5568;
          --accent: #c78c7a;
          --accent-2: #e5c4b8;
          --accent-hover: #c29585;
          --card: #f7f6f4;
          --accent-light: #f5ebe8;
          --radius: 18px;
          --container-padding: max(22px, env(safe-area-inset-left));
          --max-width: 1280px;
          --spacing-xs: 8px;
          --spacing-sm: 16px;
          --spacing-md: 24px;
          --spacing-lg: 48px;
          --spacing-xl: 80px;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            'Helvetica Neue',
            Arial,
            sans-serif;
          background: var(--bg);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          line-height: 1.6;
        }
      `}</style>

      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-[20px] border-b border-black/5 py-4 transition-all duration-300">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-padding)] flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-4 no-underline text-inherit transition-opacity duration-200 hover:opacity-80"
          >
            <h1 className="text-[21px] font-semibold m-0 tracking-[-0.02em] text-[var(--ink)]">
              Raincoat
            </h1>
          </Link>

          <nav className="flex gap-6 items-center" aria-label="Primary">
            <a
              href="#privacy"
              className="text-[var(--muted)] no-underline text-[17px] font-normal transition-colors duration-200 relative hover:text-[var(--ink)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[var(--accent)] after:transition-[width] after:duration-300 hover:after:w-full"
            >
              Privacy
            </a>
            <a
              href="#features"
              className="text-[var(--muted)] no-underline text-[17px] font-normal transition-colors duration-200 relative hover:text-[var(--ink)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[var(--accent)] after:transition-[width] after:duration-300 hover:after:w-full"
            >
              Features
            </a>
            <a
              href="#tech"
              className="text-[var(--muted)] no-underline text-[17px] font-normal transition-colors duration-200 relative hover:text-[var(--ink)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[var(--accent)] after:transition-[width] after:duration-300 hover:after:w-full"
            >
              Tech
            </a>
            <Link
              href="/"
              className="text-[var(--muted)] no-underline text-[17px] font-normal transition-colors duration-200 relative hover:text-[var(--ink)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[var(--accent)] after:transition-[width] after:duration-300 hover:after:w-full"
            >
              Labs
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section
          className="py-[var(--spacing-xl)] min-h-[calc(100vh-80px)] flex items-center"
          role="region"
          aria-labelledby="hero-heading"
        >
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-padding)] w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--spacing-xl)] items-center w-full">
              <div className="hero-content">
                <div className="text-[var(--accent)] font-semibold text-sm uppercase tracking-[0.05em] mb-4">
                  Product Demo
                </div>
                <h1
                  id="hero-heading"
                  className="text-[clamp(42px,8vw,80px)] font-bold m-0 mb-6 text-[var(--ink)] leading-[1.1] tracking-[-0.03em]"
                >
                  Smart outfits.
                  <br />
                  <strong className="text-[var(--accent)] font-bold">
                    Zero privacy compromise.
                  </strong>
                </h1>
                <p className="text-[var(--muted)] text-[21px] mb-12 max-w-[65ch] leading-[1.6] font-normal">
                  Upload your closet once and get daily, weather-based outfit suggestions. All image
                  processing runs locally. Your photos never leave your device.
                </p>

                <div className="flex gap-4 items-center flex-wrap mb-6">
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center py-[14px] px-[28px] rounded-full bg-[var(--accent)] text-white no-underline font-semibold text-[17px] transition-all duration-200 border-none cursor-pointer hover:bg-[var(--accent-hover)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(212,168,154,0.25)]"
                  >
                    See features
                  </a>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center py-[14px] px-[28px] rounded-full bg-transparent text-[var(--ink)] no-underline font-semibold text-[17px] transition-all duration-200 border border-[rgba(212,168,154,0.4)] cursor-pointer hover:bg-[rgba(212,168,154,0.08)]"
                  >
                    Back to Raincoat Labs
                  </Link>
                </div>

                <div
                  id="privacy"
                  className="mt-6 p-6 bg-[rgba(212,168,154,0.08)] rounded-[var(--radius)] border-l-4 border-[var(--accent)]"
                >
                  <h3 className="text-[21px] font-semibold mb-2">Your photos stay private</h3>
                  <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                    Raincoat runs background removal, detection, and embedding generation on-device
                    with ONNX Runtime Web and WebGPU. We only receive anonymized vectors and
                    user-validated tags.
                  </p>
                </div>
              </div>

              <div className="hero-visual relative max-h-full flex items-center">
                <div className="bg-gradient-to-br from-[rgba(212,168,154,0.08)] to-[rgba(229,196,184,0.04)] rounded-[var(--radius)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] relative w-full">
                  <div className="relative w-full overflow-hidden rounded-xl bg-white">
                    <div
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{
                        transform: `translateX(-${currentSlide * 100}%)`,
                      }}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      onMouseEnter={stopAutoplay}
                      onMouseLeave={startAutoplay}
                    >
                      {slides.map((slide, index) => (
                        <div
                          key={index}
                          className="min-w-full max-h-[70vh] flex items-center justify-center bg-white"
                        >
                          <Image
                            src={slide}
                            alt={`Raincoat app screenshot ${index + 1}`}
                            width={400}
                            height={800}
                            className="w-full h-full max-h-[70vh] object-contain block"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={prevSlide}
                      className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/95 border-none w-10 h-10 rounded-full cursor-pointer flex items-center justify-center text-[20px] text-[var(--ink)] shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-200 z-10 hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:scale-110"
                      aria-label="Previous slide"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/95 border-none w-10 h-10 rounded-full cursor-pointer flex items-center justify-center text-[20px] text-[var(--ink)] shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-200 z-10 hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:scale-110"
                      aria-label="Next slide"
                    >
                      ›
                    </button>
                  </div>
                  {/* <div className="flex gap-2 justify-center mt-4">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 border-none cursor-pointer p-0 transition-all duration-300 ${
                          index === currentSlide
                            ? "w-6 rounded bg-[var(--accent)]"
                            : "w-2 rounded-full bg-[rgba(212,168,154,0.3)]"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div> */}
                  <div className="mt-2 text-center">
                    <Link
                      href="/demo"
                      className="inline-flex items-center justify-center py-[12px] px-[16px] rounded-full bg-transparent text-[var(--ink)] no-underline font-semibold text-[17px] transition-all duration-200 border border-[rgba(212,168,154,0.4)] cursor-pointer hover:bg-[rgba(212,168,154,0.08)]"
                    >
                      Try the demo
                    </Link>
                    {/*  <Link
                      href=""
                      className="inline-flex items-center justify-center py-[12px] px-[16px] rounded-full bg-transparent text-[var(--ink)] no-underline font-semibold text-[17px] transition-all duration-200 border border-[rgba(212,168,154,0.4)] cursor-pointer hover:bg-[rgba(212,168,154,0.08)]"
                    > 
                      Demo coming soon!
                    </Link> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-[var(--spacing-xl)] bg-[var(--card)] mt-[var(--spacing-xl)]"
        >
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-padding)]">
            <div className="text-center mb-12">
              <h2 className="text-[clamp(32px,5vw,56px)] font-bold mb-4 tracking-[-0.02em]">
                Everything you need.
                <br />
                <strong>All on-device.</strong>
              </h2>
              <p className="text-[21px] text-[var(--muted)] max-w-[65ch] mx-auto">
                Smart features that respect your privacy
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Smart Auto-Tagging
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Automatic clothing classification and attribute detection to eliminate manual
                  tagging and speed up closet organization.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Weather-Based Suggestions
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Personalized outfit recommendations matched to local weather and forecast data so
                  you&apos;re always prepared.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Similarity Search
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Find visually similar items across your wardrobe and discover alternatives from
                  partner catalogs using vector search.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Multi-Location Support
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Manage multiple closets for different cities, offices, or travel destinations with
                  location-aware recommendations.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Instant Client Processing
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  ONNX models running on device with progressive loading and WebGPU acceleration for
                  near-instant results.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">Travel Mode</h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Pack smarter with suggested packing lists and outfits tailored to the forecast at
                  your destination.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section id="tech" className="py-[var(--spacing-xl)]">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-padding)]">
            <div className="bg-[var(--card)] p-12 rounded-[var(--radius)] text-center">
              <h3 className="text-[clamp(28px,4vw,42px)] font-bold mb-4 tracking-[-0.02em]">
                Built with modern tech
              </h3>
              <p className="text-[19px] text-[var(--muted)] mb-6 max-w-[65ch] mx-auto">
                Privacy-first architecture powered by on-device inference and efficient vector
                search.
              </p>
              <div className="flex flex-wrap gap-4 justify-center mt-6">
                {[
                  'Next.js',
                  'Ruby on Rails',
                  'PostgreSQL + pgvector',
                  'ONNX Runtime Web',
                  'YOLOv8',
                  'FashionCLIP',
                  'U²-Net',
                  'WebGPU',
                  'TypeScript',
                ].map(tech => (
                  <div
                    key={tech}
                    className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-[var(--ink)] py-[10px] px-5 rounded-[20px] font-semibold text-[15px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(156,163,175,0.25)]"
                  >
                    {tech}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-black/[0.08] mt-[var(--spacing-xl)]">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-padding)]">
            <div className="flex justify-between items-center flex-wrap gap-6 flex-col md:flex-row md:items-center">
              <div className="flex flex-col gap-2 items-start">
                <strong className="text-[17px] font-semibold">Raincoat</strong>
                <span className="text-[var(--muted)] text-[15px]">
                  Private, weather-aware outfit recommendations
                </span>
              </div>

              <div className="flex gap-6 items-center">
                <a
                  href="https://www.linkedin.com/company/project-raincoat/"
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--muted)] no-underline text-[15px] transition-colors duration-200 hover:text-[var(--accent)]"
                >
                  LinkedIn
                </a>
                <a
                  href="mailto:hello@raincoatlabs.nyc"
                  className="text-[var(--muted)] no-underline text-[15px] transition-colors duration-200 hover:text-[var(--accent)]"
                >
                  Contact
                </a>
                <small className="text-[var(--muted)] text-sm">© 2025 Raincoat — Prototype</small>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
