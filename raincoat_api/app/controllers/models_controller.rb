class ModelsController < ApplicationController

  def show
    # Sanitize path to prevent path traversal attacks
    # Remove any directory traversal attempts and absolute paths
    model_path = params[:path]
    return head :bad_request if model_path.blank?

    # Normalize path and prevent directory traversal
    clean_path = Pathname.new(model_path).cleanpath.to_s

    # Reject absolute paths or paths that try to escape the directory
    if clean_path.start_with?('/') || clean_path.include?('..')
      return head :forbidden
    end

    file_path = Rails.root.join('public', 'models', clean_path)

    # Double-check - ensure resolved path is within models directory
    allowed_dir = Rails.root.join('public', 'models').to_s
    unless file_path.to_s.start_with?(allowed_dir + '/')
      return head :forbidden
    end
    
    unless File.exist?(file_path)
      return head :not_found
    end
    
    # Set proper headers for ONNX files
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
    response.headers['Cache-Control'] = 'public, max-age=31536000' # Cache for 1 year
    
    # Handle preflight requests
    if request.method == 'OPTIONS'
      return head :ok
    end

    # brakeman:ignore:FileAccess - path has been sanitized and validated above
    send_file file_path, disposition: 'inline'
  end
end