"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("var(--accent)");

  const handleSignup = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email address.");
      setMessageColor("#d32f2f");
      return;
    }

    setMessage("Thanks! We will reach out with early access details.");
    setMessageColor("var(--accent)");

    const apiUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:3002/api/early-access"
        : "/api/early-access";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      const data = await response.json();
      console.log("Early access request successful:", data);

      if (data.duplicate) {
        setMessage("You are already registered for early access.");
      }
    } catch (error) {
      console.error("Early access request failed:", error);
      setMessage("There was an error. Please try again later.");
      setMessageColor("#d32f2f");
    }

    setEmail("");
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #fdfcfb;
          --muted: #8b9199;
          --ink: #4a5568;
          --accent: #d4a89a;
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
            "Inter",
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            "Helvetica Neue",
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
              Raincoat Labs
            </h1>
          </Link>

          <nav className="flex gap-6 items-center" aria-label="Primary">
            <Link
              href="/product"
              className="text-[var(--muted)] no-underline text-[17px] font-normal transition-colors duration-200 relative hover:text-[var(--ink)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[var(--accent)] after:transition-[width] after:duration-300 hover:after:w-full"
            >
              Product
            </Link>

            <a
              href="#about"
              className="text-[var(--muted)] no-underline text-[17px] font-normal transition-colors duration-200 relative hover:text-[var(--ink)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[var(--accent)] after:transition-[width] after:duration-300 hover:after:w-full"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-[var(--muted)] no-underline text-[17px] font-normal transition-colors duration-200 relative hover:text-[var(--ink)] after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[var(--accent)] after:transition-[width] after:duration-300 hover:after:w-full"
            >
              Contact
            </a>
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
                  Now Building
                </div>
                <h1
                  id="hero-heading"
                  className="text-[clamp(42px,8vw,80px)] font-bold m-0 mb-6 text-[var(--ink)] leading-[1.1] tracking-[-0.03em]"
                >
                  Visual intelligence.
                  <br />
                  <strong className="text-[var(--accent)] font-bold">
                    Privacy-first.
                  </strong>
                </h1>
                <p className="text-[var(--muted)] text-[21px] mb-12 max-w-[65ch] leading-[1.6] font-normal">
                  On-device computer vision pipelines and a licensable
                  similarity engine for fashion and retail. Add visual search,
                  recommendations, and private personalization without uploading
                  photos.
                </p>

                <div className="flex gap-4 items-center flex-wrap mb-6">
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center py-[14px] px-[28px] rounded-full bg-[var(--accent)] text-white no-underline font-semibold text-[17px] transition-all duration-200 border-none cursor-pointer hover:bg-[var(--accent-hover)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(212,168,154,0.25)]"
                  >
                    Get early access
                  </a>
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center py-[14px] px-[28px] rounded-full bg-transparent text-[var(--ink)] no-underline font-semibold text-[17px] transition-all duration-200 border border-[rgba(212,168,154,0.4)] cursor-pointer hover:bg-[rgba(212,168,154,0.08)]"
                  >
                    Try the demo
                  </Link>
                </div>

                <div className="inline-flex items-center gap-2 bg-[rgba(212,168,154,0.12)] text-[var(--ink)] py-2 px-4 rounded-[20px] font-semibold text-sm mt-6">
                  Built for retailers, marketplaces, and app developers
                </div>
              </div>

              <div className="hero-visual relative">
                <div className="bg-gradient-to-br from-[rgba(0,113,227,0.05)] to-[rgba(0,119,237,0.02)] rounded-[var(--radius)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                  <div className="w-full rounded-xl overflow-hidden bg-white aspect-[4/3] flex items-center justify-center relative">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center p-6 md:p-12 w-full">
                      {/* Client Side */}
                      <div className="bg-white rounded-xl p-2 flex flex-col gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="w-12 h-12 rounded-[10px] flex items-center justify-center mb-2 bg-gradient-to-br from-[var(--accent-light)] to-[var(--card)]">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="3"
                              y="11"
                              width="18"
                              height="11"
                              rx="2"
                              ry="2"
                            />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                        <div className="text-[15px] font-semibold text-[var(--ink)] mb-2">
                          Your Device
                        </div>
                        <div className="flex items-start gap-2 text-[13px] text-[var(--muted)] leading-[1.4]">
                          <svg
                            className="w-4 h-4 flex-shrink-0 mt-[2px]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>AI processing on-device</span>
                        </div>
                        <div className="flex items-start gap-2 text-[13px] text-[var(--muted)] leading-[1.4]">
                          <svg
                            className="w-4 h-4 flex-shrink-0 mt-[2px]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Generate embeddings</span>
                        </div>
                        <div className="mt-1">
                          <span className="inline-block bg-[rgba(212,168,154,0.1)] text-[var(--ink)] py-1 px-[10px] rounded-xl text-[11px] font-semibold m-[2px]">
                            ONNX
                          </span>
                          <span className="inline-block bg-[rgba(212,168,154,0.1)] text-[var(--ink)] py-1 px-[10px] rounded-xl text-[11px] font-semibold m-[2px]">
                            WebGPU
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex flex-col items-center gap-2 md:rotate-0 rotate-90 my-2 md:my-0">
                        <div className="text-[11px] font-semibold text-[var(--accent)] text-center leading-[1.3]">
                          API
                        </div>
                        <div className="w-10 h-[2px] bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent)] relative after:content-[''] after:absolute after:right-[-6px] after:top-[-4px] after:w-0 after:h-0 after:border-l-[6px] after:border-l-[var(--accent)] after:border-t-[5px] after:border-t-transparent after:border-b-[5px] after:border-b-transparent" />
                        <div className="text-[11px] font-semibold text-[var(--accent)] text-center leading-[1.3]">
                          2KB encrypted
                        </div>
                      </div>

                      {/* Server Side */}
                      <div className="bg-white rounded-xl p-2 flex flex-col gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="w-12 h-12 rounded-[10px] flex items-center justify-center mb-2 bg-gradient-to-br from-[var(--accent-light)] to-[var(--card)]">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                          </svg>
                        </div>
                        <div className="text-[15px] font-semibold text-[var(--ink)] mb-2">
                          Database
                        </div>
                        <div className="flex items-start gap-2 text-[13px] text-[var(--muted)] leading-[1.4]">
                          <svg
                            className="w-4 h-4 flex-shrink-0 mt-[2px]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Vector similarity search</span>
                        </div>
                        <div className="flex items-start gap-2 text-[13px] text-[var(--muted)] leading-[1.4]">
                          <svg
                            className="w-4 h-4 flex-shrink-0 mt-[2px]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Weather-aware matching</span>
                        </div>
                        <div className="mt-1">
                          <span className="inline-block bg-[rgba(212,168,154,0.1)] text-[var(--ink)] py-1 px-[10px] rounded-xl text-[11px] font-semibold m-[2px]">
                            pgvector
                          </span>
                          <span className="inline-block bg-[rgba(212,168,154,0.1)] text-[var(--ink)] py-1 px-[10px] rounded-xl text-[11px] font-semibold m-[2px]">
                            Rails
                          </span>
                        </div>
                      </div>
                    </div>
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
                Built for the <strong>future of privacy</strong>
              </h2>
              <p className="text-[21px] text-[var(--muted)] max-w-[65ch] mx-auto">
                Everything runs client side. Your images never leave your
                device.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Client-side inference
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Run optimized ONNX models on device with WebGPU/WASM for
                  real-time detection and embedding generation. Zero server
                  uploads.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Vector similarity engine
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  512D embeddings and pgvector-compatible search for "find
                  similar" and cross-catalog matching with low-latency results.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Privacy by design
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Only embeddings and user-validated metadata are shared. Reduce
                  data liability while preserving personalization and conversion
                  uplift.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Retail SDK & API
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Lightweight SDKs and REST APIs for easy integration into
                  e-commerce platforms, AR try-ons, and discovery features.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Model ops & export
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Production-ready model export (PyTorch → ONNX), progressive
                  loading, quantization, and cross-platform optimization.
                </p>
              </div>

              <div className="bg-[var(--bg)] p-6 rounded-[var(--radius)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
                <h3 className="text-2xl font-semibold m-0 mb-2 tracking-[-0.01em]">
                  Encrypted compute roadmap
                </h3>
                <p className="text-[var(--muted)] text-[17px] m-0 leading-[1.6]">
                  Research into obfuscated client-server compute and homomorphic
                  encryption to enable encrypted inference workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-[var(--spacing-xl)]">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-padding)]">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-[var(--spacing-xl)] items-center">
              <div className="about-text">
                <h3 className="text-[clamp(28px,4vw,42px)] font-bold mb-4 tracking-[-0.02em]">
                  About Raincoat Labs
                </h3>
                <p className="text-[19px] text-[var(--muted)] leading-[1.7] mb-6">
                  We build modular visual intelligence edge-AI that lets
                  developers add vision-powered features while keeping user data
                  private. Our first production use case is Raincoat, a consumer
                  app that demonstrates the tech and drives early adoption.
                </p>
              </div>

              <div className="bg-[var(--card)] p-6 rounded-[var(--radius)]">
                <h4 className="text-[21px] font-semibold mb-4">
                  Interested in a pilot or SDK?
                </h4>
                <p className="text-[var(--muted)] text-[15px] mb-4">
                  Request early access
                </p>
                <div className="flex gap-2 mt-4 flex-col sm:flex-row">
                  <input
                    className="flex-1 py-[14px] px-5 border border-black/10 rounded-full text-[17px] font-inherit transition-colors duration-200 focus:outline-none focus:border-[var(--accent)]"
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    aria-label="email for early access"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button
                    className="inline-flex items-center justify-center py-[14px] px-[28px] rounded-full bg-[var(--accent)] text-white no-underline font-semibold text-[17px] transition-all duration-200 border-none cursor-pointer hover:bg-[var(--accent-hover)] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(212,168,154,0.25)]"
                    onClick={handleSignup}
                  >
                    Request access
                  </button>
                </div>
                {message && (
                  <div
                    className="mt-2 text-[15px]"
                    style={{ color: messageColor }}
                  >
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          id="contact"
          className="py-12 border-t border-black/[0.08] mt-[var(--spacing-xl)]"
        >
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--container-padding)]">
            <div className="flex justify-between items-center flex-wrap gap-6 flex-col md:flex-row md:items-center">
              <div className="flex flex-col gap-2 items-start">
                <strong className="text-[17px] font-semibold">
                  Raincoat Labs
                </strong>
                <a
                  href="mailto:hello@raincoatlabs.nyc"
                  className="text-[var(--muted)] no-underline text-[15px] hover:text-[var(--accent)]"
                >
                  hello@raincoatlabs.nyc
                </a>
                <a
                  href="https://raincoatlabs.nyc"
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--muted)] no-underline text-[15px] hover:text-[var(--accent)]"
                >
                  raincoatlabs.nyc
                </a>
              </div>

              <div className="flex gap-6 items-center">
                <a
                  href="https://x.com/Raincoat_Labs"
                  aria-label="Twitter"
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--muted)] no-underline text-[15px] transition-colors duration-200 hover:text-[var(--accent)]"
                >
                  Twitter
                </a>
                <a
                  href="https://www.linkedin.com/company/raincoatlabs/"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--muted)] no-underline text-[15px] transition-colors duration-200 hover:text-[var(--accent)]"
                >
                  LinkedIn
                </a>
                <small className="text-[var(--muted)] text-sm">
                  Built with privacy-first AI
                </small>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
