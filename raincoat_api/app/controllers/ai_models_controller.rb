class AiModelsController < ApplicationController
  # skip_before_action :require_login

  def vanilla_clip
    # render file: Rails.root.join('public', 'models', 'clip-vit-base-patch32\vision_model_quantized.onnx')
    
  end

  def fashion_clip
    # render file: Rails.root.join('public', 'models', 'clip-vit-base-patch32\fashionclip_vision.onnx')
  
  end

end