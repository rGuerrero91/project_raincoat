require 'rails_helper'

RSpec.describe "Outfits", type: :request do
  describe "GET /index" do
    it "returns http success" do
      get "/outfits/index"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /create" do
    it "returns http success" do
      get "/outfits/create"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /show" do
    it "returns http success" do
      get "/outfits/show"
      expect(response).to have_http_status(:success)
    end
  end

  describe "GET /destroy" do
    it "returns http success" do
      get "/outfits/destroy"
      expect(response).to have_http_status(:success)
    end
  end

end
