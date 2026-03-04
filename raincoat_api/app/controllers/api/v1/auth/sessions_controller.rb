class Api::V1::Auth::SessionsController < Devise::SessionsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        success: true,
        message: "Logged in successfully",
        user: user_json(resource)
      }
    else
      render json: {
        success: false,
        error: "Invalid email or password"
      }, status: :unauthorized
    end
  end

  def respond_to_on_destroy
    if request.headers["Authorization"].present?
      render json: { success: true, message: "Logged out successfully" }
    else
      render json: { success: false, error: "No active session" }, status: :unauthorized
    end
  end

  def user_json(user)
    {
      id: user.id,
      email: user.email,
      name: user.name
    }
  end
end
