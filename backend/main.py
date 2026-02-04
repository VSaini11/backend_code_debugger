from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from config import settings
from models.schemas import (
    ErrorAnalysisRequest, 
    ErrorAnalysisResponse, 
    HealthResponse
)
from services.gemini_service import GeminiService
from services.grok_service import GrokService
from services.huggingface_service import HuggingFaceService
from services.ollama_service import OllamaService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global AI service instance
ai_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    global ai_service
    
    # Startup
    logger.info("Starting Backend Debugging Assistant API...")
    logger.info(f"AI Provider: {settings.ai_provider}")
    
    try:
        if settings.ai_provider.lower() == "ollama":
            # Local AI - NO API KEY NEEDED!
            ai_service = OllamaService(
                model_name=settings.ollama_model,
                base_url=settings.ollama_base_url,
                temperature=settings.ollama_temperature
            )
            logger.info(f"Ollama service initialized with model: {settings.ollama_model}")
            logger.info("🚀 Running LOCAL AI - No API keys, no limits, completely FREE!")
        elif settings.ai_provider.lower() == "huggingface":
            if not settings.huggingface_api_key:
                raise ValueError("HUGGINGFACE_API_KEY not configured in .env file")
            ai_service = HuggingFaceService(
                api_key=settings.huggingface_api_key,
                model_name=settings.huggingface_model,
                temperature=settings.huggingface_temperature
            )
            logger.info(f"Hugging Face service initialized with model: {settings.huggingface_model}")
        elif settings.ai_provider.lower() == "grok":
            if not settings.grok_api_key:
                raise ValueError("GROK_API_KEY not configured in .env file")
            ai_service = GrokService(
                api_key=settings.grok_api_key,
                model_name=settings.grok_model,
                temperature=settings.grok_temperature
            )
            logger.info(f"Grok service initialized with model: {settings.grok_model}")
        else:  # Default to Gemini
            if not settings.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured in .env file")
            ai_service = GeminiService(
                api_key=settings.gemini_api_key,
                model_name=settings.gemini_model,
                temperature=settings.gemini_temperature
            )
            logger.info(f"Gemini service initialized with model: {settings.gemini_model}")
    except Exception as e:
        logger.error(f"Failed to initialize AI service: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Backend Debugging Assistant API...")


# Create FastAPI app
app = FastAPI(
    title="Backend Debugging Assistant API",
    description="AI-powered error analysis using Google Gemini",
    version=settings.api_version,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Backend Debugging Assistant API",
        "version": settings.api_version,
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=settings.api_version,
        gemini_configured=ai_service is not None and ai_service.is_configured()
    )


@app.post("/api/analyze", response_model=ErrorAnalysisResponse, tags=["Analysis"])
async def analyze_error(request: ErrorAnalysisRequest):
    """
    Analyze an error using Google Gemini AI
    
    Args:
        request: ErrorAnalysisRequest containing error details
        
    Returns:
        ErrorAnalysisResponse with analysis results
        
    Raises:
        HTTPException: If analysis fails
    """
    if ai_service is None:
        logger.error("AI service not initialized")
        raise HTTPException(
            status_code=503,
            detail="AI service not available. Please check API configuration."
        )
    
    try:
        logger.info(f"Analyzing error: {request.error_type} - {request.error_message[:50]}...")
        
        analysis = await ai_service.analyze_error(
            error_message=request.error_message,
            error_type=request.error_type,
            stack_trace=request.stack_trace or "",
            context=request.context or ""
        )
        
        logger.info(
            f"Analysis complete: severity={analysis.severity}, "
            f"category={analysis.category}, confidence={analysis.confidence_score}"
        )
        
        return analysis
        
    except ValueError as e:
        logger.error(f"Validation error during analysis: {e}")
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse analysis response: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error during analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
