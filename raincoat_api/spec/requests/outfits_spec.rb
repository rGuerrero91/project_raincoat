require 'rails_helper'

RSpec.describe 'Outfits', type: :request do
  let(:user) { User.create!(email: 'test@example.com') }
  let(:location) { Location.create!(city: 'New York', country: 'US', latitude: 40.7128, longitude: -74.0060, user: user) }

  describe 'GET /api/v1/outfits' do
    it 'returns http success' do
      get '/api/v1/outfits', params: { user_id: user.id }
      expect(response).to have_http_status(:success)
    end
  end

  describe 'POST /api/v1/outfits' do
    it 'returns http success' do
      post '/api/v1/outfits', params: {
        user_id: user.id,
        location_id: location.id,
        outfit_items: []
      }
      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET /api/v1/outfits/:id' do
    it 'returns http success' do
      outfit = Outfit.create!(user: user, location: location)
      get "/api/v1/outfits/#{outfit.id}"
      expect(response).to have_http_status(:success)
    end
  end

  describe 'DELETE /api/v1/outfits/:id' do
    it 'returns http success' do
      outfit = Outfit.create!(user: user, location: location)
      delete "/api/v1/outfits/#{outfit.id}"
      expect(response).to have_http_status(:success)
    end
  end
end
