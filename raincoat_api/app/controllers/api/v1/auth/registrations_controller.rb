class Api::V1::Auth::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        success: true,
        message: "Account created successfully",
        user: user_json(resource)
      }, status: :created
    else
      render json: {
        success: false,
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
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
