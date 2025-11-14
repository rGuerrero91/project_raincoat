# config/routes.rb
Rails.application.routes.draw do
  # Root route with authentication check
  root to: 'application#index'
  
  # Basic authentication routes
  get '/signup', to: 'users#new'
  post '/signup', to: 'users#create'
  get '/login', to: 'sessions#new'
  post '/login', to: 'sessions#create'
  get '/logout', to: 'sessions#destroy'
  
  # Main closet interface
  resources :clothing_items, path: 'closet' do
    member do
      post 'upload_embedding'  # For POC: manual embedding upload
      get 'similar'           # Show similar items
    end
  end
  get 'clothing_items/new', to: 'clothing_items#new', as: 'new_clothing_item'

  # get '/closet/search', to: 'clothing_items#search', as: 'search_clothing_items'

  # get 'model_tests/yolo', to: 'model_tests#yolo'
  # Test pages for AI models
  namespace :model_tests do
    get 'yolo', to: 'yolo'
    get 'u2net', to: 'u2net'
    get 'fashionclip', to: 'fashionclip'
    get 'pipeline', to: 'pipeline'
    get 'seal', to: 'seal'
  end
  get '/ai_models/similarity_comparison', to: 'ai_models#similarity_comparison'
  
  namespace :api do
    namespace :v1 do
      resources :clothing_items, only: [:show, :create, :index] do
        member do
          get 'embedding', to: 'clothing_items#get_embedding'      # GET /api/v1/clothing_items/:id/embedding
          post 'embedding', to: 'clothing_items#save_embedding'    # POST /api/v1/clothing_items/:id/embedding
          get 'similar'         # GET /api/v1/clothing_items/:id/similar
        end
      end

      namespace :embeddings do
        post :search          # POST /api/v1/embeddings/search
        get :stats           # GET /api/v1/embeddings/stats
      end

      # Location management
      resources :locations do
        member do
          post :set_default      # POST /api/v1/locations/:id/set_default
          get :current_weather   # GET /api/v1/locations/:id/current_weather
        end
        collection do
          get :search            # GET /api/v1/locations/search?q=London
        end
      end

      # Weather endpoints
      namespace :weather do
        get :current           # GET /api/v1/weather/current
        get :recommendations   # GET /api/v1/weather/recommendations
        post :refresh          # POST /api/v1/weather/refresh
      end

      # Outfit recommendations
      resources :outfits, only: [:index, :show, :create, :destroy] do
        collection do
          post :generate       # POST /api/v1/outfits/generate - Generate outfit recommendations
        end
      end
    end
  end
  
  # Health check endpoints
  get '/health', to: 'application#health'
  get "up" => "rails/health#show", as: :rails_health_check
end