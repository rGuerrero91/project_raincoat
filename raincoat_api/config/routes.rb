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
  resources :clothing_pieces, path: 'closet' do
    member do
      post 'upload_embedding'  # For POC: manual embedding upload
      get 'similar'           # Show similar items
    end
  end
  
  get '/test_embedding', to: 'embedding_test#index'
  
  # API endpoints
  namespace :api do
    namespace :v1 do
      resources :clothing_pieces, only: [:show, :create, :index] do
        member do
          post 'embedding'      # POST /api/v1/clothing_pieces/:id/embedding
          get 'similar'         # GET /api/v1/clothing_pieces/:id/similar
        end
      end

      namespace :embeddings do
        post :search          # POST /api/v1/embeddings/search
        get :stats           # GET /api/v1/embeddings/stats
      end
    end
  end
  
  # Health check
  get '/health', to: 'application#health'
end