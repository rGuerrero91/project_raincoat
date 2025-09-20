# config/routes.rb
Rails.application.routes.draw do
  # Root route with authentication check
  root to: 'application#index'
  
  # Basic authentication routes
  get '/signup', to: 'users#new'
  post '/signup', to: 'users#create'
  get '/login', to: 'sessions#new'
  post '/login', to: 'sessions#create'
  get '/logout', to: 'sessions#destroy'  # Changed to GET
  
  # Main wardrobe interface (this creates clothing_pieces_path)
  resources :clothing_pieces, path: 'wardrobe' do
    member do
      post 'upload_embedding'  # For POC: manual embedding upload
    end
  end
  
  # API routes for embedding functionality
  namespace :api do
    namespace :v1 do
      resources :clothing_pieces, only: [:show, :create, :index] do
        member do
          post 'embedding'      # POST /api/v1/clothing_pieces/:id/embedding
          get 'similar'         # GET /api/v1/clothing_pieces/:id/similar
        end
      end
      
      # General embedding search
      post 'embeddings/search', to: 'embeddings#search'
    end
  end
  
  # Health check
  get '/health', to: 'application#health'
end