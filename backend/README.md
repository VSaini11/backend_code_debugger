# Backend Debugging Assistant API

AI-powered error analysis using Google Gemini and FastAPI.

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.3
CORS_ORIGINS=http://localhost:3000
```

**Get your Gemini API key:** https://makersuite.google.com/app/apikey

### 3. Run the Server

```bash
# From the backend directory
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- **Interactive API docs:** http://localhost:8000/docs
- **Alternative docs:** http://localhost:8000/redoc

## Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "gemini_configured": true
}
```

### Analyze Error
```
POST /api/analyze
```

Request body:
```json
{
  "error_message": "Cannot read property 'map' of undefined",
  "error_type": "TypeError",
  "stack_trace": "at Object.<anonymous> (/app/index.js:10:5)",
  "context": "Production environment, user signup flow"
}
```

Response:
```json
{
  "severity": "high",
  "category": "Runtime Error",
  "root_cause": "Attempting to call .map() on an undefined variable",
  "recommendations": [
    "Add null/undefined checks before accessing properties",
    "Use optional chaining (?.) operator",
    "Initialize variables with default values"
  ],
  "related_errors": ["TypeError", "ReferenceError"],
  "confidence_score": 0.92,
  "analysis_metadata": {
    "model": "gemini-1.5-flash",
    "timestamp": 1706543210,
    "processing_time_ms": 1234.56
  }
}
```

## Testing

Test the API using curl:

```bash
# Health check
curl http://localhost:8000/health

# Analyze an error
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "error_message": "Connection timeout",
    "error_type": "DatabaseError",
    "stack_trace": "at Database.connect (/app/db.js:45:10)",
    "context": "Production database connection"
  }'
```

## Project Structure

```
backend/
├── main.py                 # FastAPI application
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── .env.example          # Environment template
├── models/
│   ├── __init__.py
│   └── schemas.py        # Pydantic models
└── services/
    ├── __init__.py
    └── gemini_service.py # Gemini AI service
```

## Troubleshooting

**Issue:** `GEMINI_API_KEY not found`
- Make sure you created a `.env` file in the `backend` directory
- Verify your API key is correct

**Issue:** CORS errors from frontend
- Check that `CORS_ORIGINS` in `.env` includes your Next.js URL
- Default is `http://localhost:3000`

**Issue:** Slow responses
- Gemini API calls can take 2-5 seconds
- Consider implementing caching for repeated errors
