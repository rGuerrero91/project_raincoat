class Api::V1::BaseController < ApplicationController
  protect_from_forgery with: :null_session
  respond_to :json

  before_action :authenticate_api_user

  private

  def authenticate_api_user
    # For POC: Simple token-based auth or session-based
    # most likely gonna use jwt in dev

    if session[:user_id].present?
      @current_user = User.find(session[:user_id])
    elsif request.headers['Authorization'].present?
      # Support for Authorization header: Bearer <user_email>
      email = request.headers['Authorization'].gsub('Bearer ', '')
      @current_user = User.find_by(email: email)
    end

    unless @current_user
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def render_error(message, status = :unprocessable_entity)
    render json: { error: message }, status: status
  end

  def render_success(data = {}, message = nil)
    response = { success: true }
    response[:message] = message if message
    response[:data] = data if data.any?
    render json: response
  end
end
