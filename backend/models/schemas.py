from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class ErrorAnalysisRequest(BaseModel):
    """Request model for error analysis"""
    error_message: str = Field(..., min_length=1, description="The error message")
    error_type: str = Field(..., min_length=1, description="Type of error (e.g., TypeError, NetworkError)")
    stack_trace: Optional[str] = Field(None, description="Stack trace if available")
    context: Optional[str] = Field(None, description="Additional context about the error")

    class Config:
        json_schema_extra = {
            "example": {
                "error_message": "Cannot read property 'map' of undefined",
                "error_type": "TypeError",
                "stack_trace": "at Object.<anonymous> (/app/index.js:10:5)",
                "context": "Production environment, user signup flow"
            }
        }


class AnalysisMetadata(BaseModel):
    """Metadata about the analysis"""
    model: str = Field(..., description="LLM model used for analysis")
    timestamp: int = Field(..., description="Unix timestamp of analysis")
    processing_time_ms: float = Field(..., description="Time taken to process in milliseconds")


class ErrorAnalysisResponse(BaseModel):
    """Response model for error analysis"""
    severity: Literal["critical", "high", "medium", "low"] = Field(
        ..., description="Severity level of the error"
    )
    category: str = Field(..., description="Category of the error (e.g., Database, Network, Runtime)")
    root_cause: str = Field(..., description="Identified root cause of the error")
    recommendations: List[str] = Field(
        ..., min_items=1, max_items=6, description="List of actionable recommendations"
    )
    related_errors: List[str] = Field(
        default_factory=list, description="List of related error patterns"
    )
    code_snippet: Optional[str] = Field(
        None, description="Relevant code snippet where the error occurred"
    )
    request_payload: Optional[str] = Field(
        None, description="Request payload that triggered the error (if available)"
    )
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence score of the analysis (0.0 to 1.0)"
    )
    analysis_metadata: AnalysisMetadata = Field(..., description="Metadata about the analysis")

    class Config:
        json_schema_extra = {
            "example": {
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
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    gemini_configured: bool = Field(..., description="Whether Gemini API is configured")
