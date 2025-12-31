# Be sure to restart your server when you modify this file.

# Add new mime types for use in respond_to blocks:
# Mime::Type.register "text/richtext", :rtf

# ONNX Runtime Web WASM files
# Required for proper WASM loading and WebGPU support
Mime::Type.register 'application/wasm', :wasm
Rack::Mime::MIME_TYPES['.wasm'] = 'application/wasm'
Rack::Mime::MIME_TYPES['.mjs'] = 'application/javascript'
