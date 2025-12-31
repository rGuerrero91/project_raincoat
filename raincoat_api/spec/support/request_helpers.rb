module RequestHelpers
  # Helper to parse JSON response body
  def json_response
    @json_response ||= JSON.parse(response.body, symbolize_names: true)
  end

  # Helper to create authenticated headers with JWT token
  def authenticated_header(user)
    token = generate_jwt_token(user)
    { 'Authorization' => "Bearer #{token}" }
  end

  # Helper to create JWT token for user (adjust based on your auth implementation)
  def generate_jwt_token(user)
    # This is a placeholder - adjust based on your actual JWT implementation
    # Example: Devise JWT or custom JWT encoding
    payload = {
      user_id: user.id,
      exp: 24.hours.from_now.to_i
    }
    # Replace with your actual JWT secret and encoding logic
    JWT.encode(payload, Rails.application.credentials.secret_key_base)
  rescue => e
    Rails.logger.error("Failed to generate JWT token: #{e.message}")
    nil
  end

  # Helper for common headers
  def json_headers
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  # Helper to make authenticated requests
  def authenticated_get(path, user:, headers: {})
    get path, headers: authenticated_header(user).merge(json_headers).merge(headers)
  end

  def authenticated_post(path, user:, params: {}, headers: {})
    post path,
         params: params.to_json,
         headers: authenticated_header(user).merge(json_headers).merge(headers)
  end

  def authenticated_put(path, user:, params: {}, headers: {})
    put path,
        params: params.to_json,
        headers: authenticated_header(user).merge(json_headers).merge(headers)
  end

  def authenticated_delete(path, user:, headers: {})
    delete path, headers: authenticated_header(user).merge(json_headers).merge(headers)
  end
end
