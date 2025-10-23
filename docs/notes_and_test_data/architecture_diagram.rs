[User Device: Browser / Mobile App]
  ├─ UI (Next.js / React Native)
  ├─ Local Preprocessing
  │    • Auto-crop (YOLOv8n)
  │    • Background removal (U2-Net)
  │    • Color/lighting normalize
  ├─ On-device Inference (ONNX Runtime Web / TFLite / Core ML)
  │    • FashionCLIP image encoder -> 512D embedding
  │    • Optional lightweight tagger or YOLO classifier
  ├─ Local Cache & UX
  │    • Cache embeddings, thumbnails, user tags, model versions
  │    • Offline recommendations UI
  └─ Outbound (only if user approves)
       • POST: {embedding vector, metadata, user-validated tags, model_version}
       • to: Raincoat Ingest API / Retail SDK endpoint

[CDN / Static hosting]
  └─ Serves ONNX models, WASM runtimes, label embeddings, JS SDK

[Raincoat Cloud / On-Prem (multi-tenant)]
  ├─ Ingest API (Rails API)
  │    • Authentication (JWT for consumers; API keys / mutual TLS for retailers)
  │    • Validate payloads, rate limit, telemetry
  ├─ Vector Store / Search
  │    • PostgreSQL + pgvector (primary) OR vector DB (Faiss/Weaviate/Marqo) for scale
  │    • Precomputed label embeddings, index shards, ANN indexes
  ├─ Metadata DB
  │    • PostgreSQL schemas: users, closets, clothing_pieces, outfits, locations, model_versions
  ├─ Recommendation Engine
  │    • Hybrid layer: cosine similarity on vectors + rule-based weather scoring
  │    • Policy layer: personalization, diversity, item constraints (category, layer_order)
  ├─ Retail SDK / API Layer (productized)
  │    • REST/GraphQL for search, similarity, tagging, real-time suggestions
  │    • Web SDK / JS embed for client-side inference integration
  ├─ Admin / Dashboard
  │    • Pilot management, logs, usage metrics, billing, model version control
  ├─ ML Ops & Model Serving
  │    • Model training / fine-tuning pipelines (PyTorch) -> ONNX export
  │    • Model registry, versioning, A/B testing
  └─ Infrastructure
       • Docker Compose / Kubernetes, CI/CD (GitHub Actions), monitoring (Prometheus/Grafana / Sentry), logs (ELK / Splunk)
       • Secrets & keys: KMS (AWS/GCP), API keys, tenant isolation

[Third-party services]
  ├─ WeatherAPI (live conditions)
  ├─ Payment/Billing (Stripe) — for B2B SaaS
  ├─ CDN (Cloudflare / AWS CloudFront) — for model / static assets
  └─ Identity & Auth (Auth.js/NextAuth for frontend experiments; API-only: JWT + Devise in Rails for backend)

[Retailer / Partner integration]
  ├─ Retailer can embed the **Raincoat SDK** (JS or mobile lib) to run on-device inference locally and call Retail API for indexing / similarity.
  ├─ Option: On-prem or private cloud deployment for sensitive enterprise customers.

