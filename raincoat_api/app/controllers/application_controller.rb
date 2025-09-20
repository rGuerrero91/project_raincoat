# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  include ActionController::Flash 
  protect_from_forgery with: :null_session
  
  def index
    if current_user
      redirect_to clothing_pieces_path
    else
      redirect_to signup_path
    end
  end
  
  private
  
  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end
  helper_method :current_user
  
  def require_login
    unless current_user
      redirect_to signup_path, alert: 'Please create an account or log in to continue.'
    end
  end
  
  def health
    render json: { status: 'ok', timestamp: Time.current }
  end
end