'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Container from '@/components/Container';
import Button from '@/components/Button';
import Card from '@/components/Card';
import {
  ArrowLeft,
  Tag,
  Palette,
  Shirt,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import apiClient, { ClothingPiece } from '@/lib/api';

interface SimilarPiece {
  piece: ClothingPiece;
  similarity_score: number;
  similarity_percentage: string;
}

export default function ClothingPieceViewPage() {
  const params = useParams();
  const router = useRouter();
  const pieceId = parseInt(params.id as string);

  const [piece, setPiece] = useState<ClothingPiece | null>(null);
  const [similarPieces, setSimilarPieces] = useState<SimilarPiece[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmbedding, setShowEmbedding] = useState(false);
  const [embeddingData, setEmbeddingData] = useState<number[] | null>(null);

  useEffect(() => {
    const fetchPieceData = async () => {
      try {
        console.log('Fetching clothing piece:', pieceId);

        // Fetch clothing piece details
        const pieceResponse = await apiClient.getClothingPiece(pieceId);

        if (pieceResponse.success && pieceResponse.data) {
          setPiece(pieceResponse.data);
          console.log('Clothing piece loaded:', pieceResponse.data);

          // Fetch similar pieces if embedding exists
          if (pieceResponse.data.has_embedding) {
            const similarResponse = await apiClient.getSimilarItems(pieceId, 5);
            if (similarResponse.success && similarResponse.data) {
              setSimilarPieces(similarResponse.data.similar_pieces || []);
            }
          }
        } else {
          setError('Clothing piece not found');
        }
      } catch (err) {
        console.error('Failed to load clothing piece:', err);
        setError('Failed to load clothing piece details');
      } finally {
        setIsLoading(false);
      }
    };

    if (pieceId) {
      fetchPieceData();
    }
  }, [pieceId]);

  const toggleEmbeddingVector = async () => {
    if (showEmbedding) {
      // Hide the embedding
      setShowEmbedding(false);
      return;
    }

    // Fetch and show embedding if not already loaded
    if (!piece?.has_embedding) return;

    if (!embeddingData) {
      try {
        const response = await apiClient.getItemEmbedding(pieceId);
        if (response.success && response.data?.embedding?.vector_data) {
          setEmbeddingData(response.data.embedding.vector_data);
          setShowEmbedding(true);
        }
      } catch (err) {
        console.error('Failed to load embedding:', err);
      }
    } else {
      // Data already loaded, just show it
      setShowEmbedding(true);
    }
  };

  // Determine weather suitability based on tags
  const getWeatherSuitability = (tags: string[] = []) => {
    const suitability = {
      hot: 0,
      warm: 0,
      cool: 0,
      cold: 0,
      rainy: 0,
      windy: 0,
    };

    const tagStr = tags.join(' ').toLowerCase();

    // Hot weather indicators
    if (tagStr.match(/tank|shorts|summer|lightweight|breathable|sleeveless/)) {
      suitability.hot = 2;
      suitability.warm = 1;
    }

    // Cold weather indicators
    if (tagStr.match(/coat|jacket|sweater|hoodie|winter|warm|thermal|fleece|down/)) {
      suitability.cold = 2;
      suitability.cool = 1;
    }

    // Rain indicators
    if (tagStr.match(/waterproof|raincoat|rain jacket|umbrella/)) {
      suitability.rainy = 2;
    }

    // Wind indicators
    if (tagStr.match(/windbreaker|windproof/)) {
      suitability.windy = 2;
    }

    return suitability;
  };

  const WeatherBadge = ({
    icon: Icon,
    label,
    level
  }: {
    icon: any;
    label: string;
    level: number
  }) => {
    if (level === 0) return null;

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
        level === 2 ? 'bg-primary text-white' : 'bg-primary-light text-primary'
      }`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Container className="py-8 min-h-screen">
        <Card padding="xl" className="text-center">
          <div className="flex justify-center mb-4 animate-float">
            <Shirt className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-neutral-medium">Loading clothing piece...</p>
        </Card>
      </Container>
    );
  }

  if (error || !piece) {
    return (
      <Container className="py-8 min-h-screen">
        <Card padding="xl" className="text-center">
          <p className="text-red-500 mb-4">{error || 'Clothing piece not found'}</p>
          <Button variant="secondary" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      </Container>
    );
  }

  const weatherSuitability = getWeatherSuitability([...(piece.ai_tags || []), ...(piece.user_tags || [])]);

  return (
    <Container className="py-8 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-headline font-bold mb-2">
          {piece.name || `${piece.category} Piece`}
        </h1>
        {piece.description && (
          <p className="text-lg text-neutral-medium">{piece.description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Image Card */}
        <Card padding="md">
          <div className="aspect-square bg-neutral-light rounded-xl overflow-hidden mb-4">
            {piece.images && piece.images.length > 0 ? (
              <img
                src={piece.images[0].url}
                alt={piece.name || 'Clothing piece'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Shirt className="w-24 h-24 text-neutral-medium" strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-neutral-medium mb-1">Category</p>
              <p className="font-semibold capitalize">{piece.category}</p>
            </div>

            {piece.brand && (
              <div>
                <p className="text-sm text-neutral-medium mb-1">Brand</p>
                <p className="font-semibold">{piece.brand}</p>
              </div>
            )}

            {piece.colors && piece.colors.length > 0 && (
              <div>
                <p className="text-sm text-neutral-medium mb-2">Colors</p>
                <div className="flex gap-2 flex-wrap">
                  {piece.colors.map((color, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 bg-neutral-light rounded-full text-sm"
                    >
                      <Palette className="w-3 h-3" />
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {piece.materials && piece.materials.length > 0 && (
              <div>
                <p className="text-sm text-neutral-medium mb-2">Materials</p>
                <div className="flex gap-2 flex-wrap">
                  {piece.materials.map((material, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-neutral-light rounded-full text-sm"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Details Card */}
        <div className="space-y-6">
          {/* AI Tags */}
          {piece.ai_tags && piece.ai_tags.length > 0 && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">AI-Generated Tags</h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                {piece.ai_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-light text-primary rounded-full text-sm font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* User Tags */}
          {piece.user_tags && piece.user_tags.length > 0 && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-ink" />
                <h3 className="font-semibold">User Tags</h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                {piece.user_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-neutral-light rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Weather Suitability */}
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Weather Suitability</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              <WeatherBadge icon={Sun} label="Hot" level={weatherSuitability.hot} />
              <WeatherBadge icon={Sun} label="Warm" level={weatherSuitability.warm} />
              <WeatherBadge icon={Wind} label="Cool" level={weatherSuitability.cool} />
              <WeatherBadge icon={Snowflake} label="Cold" level={weatherSuitability.cold} />
              <WeatherBadge icon={CloudRain} label="Rainy" level={weatherSuitability.rainy} />
              <WeatherBadge icon={Wind} label="Windy" level={weatherSuitability.windy} />
            </div>
            {Object.values(weatherSuitability).every(v => v === 0) && (
              <p className="text-sm text-neutral-medium italic">
                No weather preferences detected from tags
              </p>
            )}
          </Card>

          {/* Embedding Info */}
          {piece.has_embedding && piece.embedding && (
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">AI Embedding</h3>
                </div>
                <Button
                  variant="secondary"
                  onClick={toggleEmbeddingVector}
                  className="text-sm px-3 py-1.5"
                >
                  {showEmbedding ? 'Hide' : 'View'} Vector
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-medium">Model:</span>
                  <span className="font-medium">{piece.embedding.model_version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-medium">Dimensions:</span>
                  <span className="font-medium">{piece.embedding.vector_dimensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-medium">Created:</span>
                  <span className="font-medium">
                    {new Date(piece.embedding.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {showEmbedding && embeddingData && (
                <div className="mt-4 p-3 bg-neutral-light rounded-lg">
                  <p className="text-xs text-neutral-medium mb-2">
                    Vector Data (first 10 dimensions):
                  </p>
                  <code className="text-xs font-mono break-all block">
                    [{embeddingData.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]
                  </code>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Similar Pieces */}
      {similarPieces.length > 0 && (
        <Card padding="md" className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Similar Pieces</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {similarPieces.map((similar) => (
              <button
                key={similar.piece.id}
                onClick={() => router.push(`/items/${similar.piece.id}`)}
                className="text-left hover:opacity-80 transition-opacity"
              >
                <div className="aspect-square bg-neutral-light rounded-lg overflow-hidden mb-2">
                  {similar.piece.images && similar.piece.images.length > 0 ? (
                    <img
                      src={similar.piece.images[0].url}
                      alt={similar.piece.name || 'Similar piece'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="w-12 h-12 text-neutral-medium" strokeWidth={1} />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium mb-1 truncate">
                  {similar.piece.name || similar.piece.category}
                </p>
                <p className="text-xs text-primary font-semibold">
                  {similar.similarity_score.toFixed(0)}% similar
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}
    </Container>
  );
}
