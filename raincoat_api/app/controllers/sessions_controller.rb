class SessionsController < ApplicationController
  def new
    redirect_to clothing_items_path if current_user
  end

  def create
    user = User.find_by(email: params[:email].downcase.strip)

    if user
      session[:user_id] = user.id
      redirect_to clothing_items_path, notice: 'Logged in successfully!'
    else
      flash.now[:alert] = 'Invalid email address. Please try again or create an account.'
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    session[:user_id] = nil
    redirect_to root_path, notice: 'Logged out successfully!'
  end
end
