from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # AI Provider Selection
    ai_provider: str = "ollama"  # Options: "gemini", "grok", "huggingface", or "ollama"
    
    # Gemini Configuration
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    gemini_temperature: float = 0.3
    
    # Grok Configuration
    grok_api_key: str = ""
    grok_model: str = "grok-beta"
    grok_temperature: float = 0.3
    
    # Hugging Face Configuration
    huggingface_api_key: str = ""
    huggingface_model: str = "meta-llama/Llama-3.2-3B-Instruct"
    huggingface_temperature: float = 0.3
    
    # Ollama Configuration (Local AI - NO API KEY NEEDED!)
    ollama_model: str = "phi3:mini"
    ollama_base_url: str = "http://localhost:11434"
    ollama_temperature: float = 0.3
    
    # Server Configuration
    cors_origins: str = "http://localhost:3000"
    max_retries: int = 3
    request_timeout: int = 30
    
    # API Configuration
    api_version: str = "1.0.0"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
