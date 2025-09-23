API Endpoints Summary
Clothing Pieces API

GET /api/v1/clothing_pieces - List all user's clothing with embedding status
GET /api/v1/clothing_pieces/:id - Get specific piece with embedding details
POST /api/v1/clothing_pieces - Create new clothing piece
POST /api/v1/clothing_pieces/:id/embedding - Store embedding vector
GET /api/v1/clothing_pieces/:id/similar - Find similar items

Embeddings API

POST /api/v1/embeddings/search - Search by vector (no specific piece needed)
GET /api/v1/embeddings/stats - Get embedding statistics and analytics