// API client for Rails backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
}

export interface WeatherRecommendation {
  name: string;
  item_count?: number;
  reason?: string;
  description?: string;
}

export interface WeatherRecommendationsResponse {
  weather?: WeatherInfo;
  recommendations?: WeatherRecommendation[];
}

export interface CurrentWeatherResponse {
  temperature: number;
  condition: string;
  humidity?: number;
  wind_speed?: number;
  forecast?: string;
  details?: string;
  location?: {
    city?: string;
    country?: string;
  };
}

class ApiClient {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;

    // Load session from localStorage if available
    if (typeof window !== 'undefined') {
      this.sessionId = localStorage.getItem('raincoat_session_id');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add session ID if available
    if (this.sessionId) {
      headers['X-Session-Id'] = this.sessionId;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // Store session ID from response if present
      const newSessionId = response.headers.get('X-Session-Id');
      if (newSessionId && typeof window !== 'undefined') {
        this.sessionId = newSessionId;
        localStorage.setItem('raincoat_session_id', newSessionId);
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'An error occurred',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // Authentication
  async signup(email: string, password: string) {
    return this.request('/signup', {
      method: 'POST',
      body: JSON.stringify({ user: { email, password } }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ user: { email, password } }),
    });
  }

  // Clothing Items
  async getClothingItems() {
    return this.request('/api/v1/clothing_pieces');
  }

  async createClothingItem(data: {
    name?: string;
    category: string;
    ai_tags?: any;
    user_tags?: any;
    colors?: string[];
    materials?: string[];
  }) {
    return this.request('/api/v1/clothing_pieces', {
      method: 'POST',
      body: JSON.stringify({ clothing_piece: data }),
    });
  }

  async uploadEmbedding(itemId: number, embedding: number[]) {
    return this.request(`/api/v1/clothing_pieces/${itemId}/embedding`, {
      method: 'POST',
      body: JSON.stringify({ embedding }),
    });
  }

  async getSimilarItems(itemId: number, limit: number = 10) {
    return this.request(`/api/v1/clothing_pieces/${itemId}/similar?limit=${limit}`);
  }

  // Locations
  async getLocations() {
    return this.request('/api/v1/locations');
  }

  async createLocation(data: {
    name: string;
    city: string;
    state?: string;
    country: string;
    latitude: number;
    longitude: number;
    is_default?: boolean;
  }) {
    return this.request('/api/v1/locations', {
      method: 'POST',
      body: JSON.stringify({ location: data }),
    });
  }

  async searchLocation(query: string) {
    return this.request(`/api/v1/locations/search?q=${encodeURIComponent(query)}`);
  }

  async setDefaultLocation(locationId: number) {
    return this.request(`/api/v1/locations/${locationId}/set_default`, {
      method: 'POST',
    });
  }

  // Weather
  async getCurrentWeather() {
    return this.request<CurrentWeatherResponse>('/api/v1/weather/current');
  }

  async getWeatherRecommendations() {
    return this.request<WeatherRecommendationsResponse>('/api/v1/weather/recommendations');
  }

  async refreshWeather() {
    return this.request('/api/v1/weather/refresh', {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
