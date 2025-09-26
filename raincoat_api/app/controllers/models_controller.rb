class ModelsController < ApplicationController
  skip_before_action :require_login
  
  
  def show
    model_path = params[:path]
    file_path = Rails.root.join('public', 'models', model_path)
    
    # Security check - ensure path is within models directory
    unless file_path.to_s.start_with?(Rails.root.join('public', 'models').to_s)
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
    response.headers['Cache-Control'] = 'public, max-age=31536000' # Cache for 1 year
    
    # Handle preflight requests
    if request.method == 'OPTIONS'
      return head :ok
    end
    
    send_file file_path, disposition: 'inline'
  end
end