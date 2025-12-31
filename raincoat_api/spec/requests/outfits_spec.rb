require 'rails_helper'

RSpec.describe 'Outfits', type: :request do
  let(:user) { User.create!(email: 'test@example.com', name: 'Test User') }

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
        outfit: {
          weather_condition: 'sunny',
          weather_temperature: 72.0
        },
        items: {}
      }
      expect(response).to have_http_status(:success)
    end
  end

  describe 'GET /api/v1/outfits/:id' do
    it 'returns http success' do
      outfit = Outfit.create!(user: user, weather_condition: 'sunny')
      get "/api/v1/outfits/#{outfit.id}"
      expect(response).to have_http_status(:success)
    end
  end

  describe 'DELETE /api/v1/outfits/:id' do
    it 'returns http success' do
      outfit = Outfit.create!(user: user, weather_condition: 'sunny')
      delete "/api/v1/outfits/#{outfit.id}"
      expect(response).to have_http_status(:success)
    end
  end
end
