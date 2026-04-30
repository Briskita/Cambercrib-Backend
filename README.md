# Cambridge Backend

Node.js backend with Express, MongoDB and Swagger docs.

## Setup

1. Install dependencies:
   - `npm install`
2. Ensure `.env` exists in the project root and contains your connection strings/secrets.
   - Required for Cloudinary uploads:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
3. Run:
   - `npm run dev`

## API Docs

- Swagger UI: `http://localhost:5000/api/docs`

## Property Listing APIs

- `POST /api/properties` (authenticated, multipart/form-data)
  - Fields: `title`, `description`, `location`, `initialDepositAllowed`, `amenities` (JSON array), `contacts` (JSON object), stats fields (`soldPlots`, `reservedPlots`, `numberOfInvestors`, `completionRate`, `totalInvestment`)
  - Files: `images[]`, `documents[]`, `propertyVideoTour`, `propertyLayoutImage`
- `POST /api/properties/:propertyId/units` (authenticated)
  - Body: `{ "units": [{ "name": "...", "price": 1000, "landmass": 300, "status": "available", "investButtonLabel": "Invest" }] }`
- `PATCH /api/properties/:propertyId` (authenticated)
- `DELETE /api/properties/:propertyId` (authenticated)
- `PATCH /api/properties/:propertyId/units/:unitId` (authenticated)
- `PATCH /api/properties/:propertyId/units/:unitId/status` (authenticated)
  - Body: `{ "status": "available" | "reserved" | "sold" }`
- `DELETE /api/properties/:propertyId/units/:unitId` (authenticated)
- `GET /api/properties`
- `GET /api/properties/:propertyId`
