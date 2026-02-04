import os
import time
import json
from typing import Dict, Any
from huggingface_hub import InferenceClient
from models.schemas import ErrorAnalysisResponse, AnalysisMetadata


class HuggingFaceService:
    """Service for analyzing errors using Hugging Face Inference API"""
    
    def __init__(self, api_key: str, model_name: str = "meta-llama/Llama-3.2-3B-Instruct", temperature: float = 0.3):
        """
        Initialize Hugging Face service
        
        Args:
            api_key: Hugging Face API token
            model_name: Model to use (default: Llama-3.2-3B-Instruct)
            temperature: Temperature for generation (0.0-1.0)
        
        Popular FREE models:
        - meta-llama/Llama-3.2-3B-Instruct (fast, good quality)
        - mistralai/Mistral-7B-Instruct-v0.3 (excellent quality)
        - Qwen/Qwen2.5-7B-Instruct (very good)
        - microsoft/Phi-3-mini-4k-instruct (fast, lightweight)
        """
        self.client = InferenceClient(token=api_key)
        self.model_name = model_name
        self.temperature = temperature
        
    def _build_analysis_prompt(
        self, 
        error_message: str, 
        error_type: str, 
        stack_trace: str = "", 
        context: str = ""
    ) -> str:
        """Build structured prompt for error analysis"""
        
        prompt = f"""You are a backend debugging assistant used by professional engineers.

Your goal is ACCURACY and HONESTY, not confidence.

STRICT RULES (DO NOT BREAK):
1. Do NOT guess root causes when diagnostic data is missing.
2. If stack trace or code context is missing, explicitly say "The root cause cannot be determined conclusively."
3. Never invent function names, file names, or logic not present in the input.
4. Do NOT suggest code-level fixes unless the error location is clear.
5. Prefer "insufficient data" over speculative explanations.
6. Use cautious language when certainty is low.

ERROR ANALYSIS BEHAVIOR:
- Identify the most likely error category ONLY if supported by the input.
- If the error message is generic (e.g., "Internal Server Error"), classify it as "Runtime Error – Unknown".
- When null/undefined access is not explicitly shown, do not assume it.

CONFIDENCE GUIDANCE:
- Suggest LOW confidence (0.3-0.5) when:
  • Stack trace is missing
  • Error message is generic
  • Context is vague or user-reported
- Suggest HIGH confidence (0.8-0.95) ONLY when:
  • Stack trace is present
  • Error pattern is explicit
  • Failure point is identifiable

ERROR DETAILS:
- Error Type: {error_type}
- Error Message: {error_message}
- Stack Trace: {stack_trace if stack_trace else "Not provided"}
- Context: {context if context else "Not provided"}

REQUIRED OUTPUT STRUCTURE (JSON only, no markdown):
{{
  "severity": "critical|high|medium|low",
  "category": "string (industry-friendly category)",
  "root_cause": "string (Explain WHY, or state 'Insufficient data' if unclear. Do not restate error.)",
  "recommendations": [
    "string (diagnostic step or specific fix if clear)",
    "string (preventive measure)"
  ],
  "related_errors": ["string", "string"],
  "code_snippet": "string (code snippet from context, or null if missing)",
  "request_payload": "string (JSON payload from context, or null if missing)",
  "confidence_score": 0.0-1.0
}}

Now analyze the error above adhering STRICTLY to these rules. Respond ONLY with valid JSON:"""
        
        return prompt
    
    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse Hugging Face response and extract JSON
        
        Args:
            response_text: Raw response from Hugging Face
            
        Returns:
            Parsed JSON as dictionary
        """
        # Remove markdown code blocks if present
        text = response_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        text = text.strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            # Fallback: try to find JSON in the response
            import re
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            raise ValueError(f"Failed to parse JSON from Hugging Face response: {e}")
    
    def _calculate_confidence_adjustment(
        self, 
        error_message: str, 
        stack_trace: str, 
        context: str,
        base_confidence: float
    ) -> float:
        """
        Adjust confidence score based on available information
        
        Args:
            error_message: The error message
            stack_trace: Stack trace if available
            context: Additional context
            base_confidence: Confidence from model
            
        Returns:
            Adjusted confidence score
        """
        adjustments = 0.0
        
        # Penalize if no stack trace
        if not stack_trace or len(stack_trace.strip()) < 10:
            adjustments -= 0.1
        
        # Penalize if no context
        if not context or len(context.strip()) < 5:
            adjustments -= 0.05
        
        # Penalize if error message is very short
        if len(error_message.strip()) < 20:
            adjustments -= 0.05
        
        # Bonus if stack trace is detailed
        if stack_trace and len(stack_trace.strip()) > 100:
            adjustments += 0.05
        
        # Ensure confidence stays in valid range
        adjusted = max(0.0, min(1.0, base_confidence + adjustments))
        return round(adjusted, 2)
    
    async def analyze_error(
        self, 
        error_message: str, 
        error_type: str, 
        stack_trace: str = "", 
        context: str = ""
    ) -> ErrorAnalysisResponse:
        """
        Analyze an error using Hugging Face AI
        
        Args:
            error_message: The error message
            error_type: Type of error
            stack_trace: Stack trace if available
            context: Additional context
            
        Returns:
            ErrorAnalysisResponse with analysis results
        """
        start_time = time.time()
        
        # Build prompt
        prompt = self._build_analysis_prompt(error_message, error_type, stack_trace, context)
        
        # Call Hugging Face
        response = self.client.chat_completion(
            messages=[
                {"role": "system", "content": "You are an expert debugging assistant. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            model=self.model_name,
            temperature=self.temperature,
            max_tokens=2048
        )
        
        response_text = response.choices[0].message.content
        
        # Parse response
        analysis_data = self._parse_response(response_text)
        
        # Adjust confidence score
        base_confidence = analysis_data.get("confidence_score", 0.7)
        adjusted_confidence = self._calculate_confidence_adjustment(
            error_message, stack_trace, context, base_confidence
        )
        analysis_data["confidence_score"] = adjusted_confidence
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        # Add metadata
        analysis_data["analysis_metadata"] = AnalysisMetadata(
            model=self.model_name,
            timestamp=int(time.time()),
            processing_time_ms=round(processing_time_ms, 2)
        )
        
        # Validate and return
        return ErrorAnalysisResponse(**analysis_data)
    
    def is_configured(self) -> bool:
        """Check if Hugging Face service is properly configured"""
        try:
            return self.client is not None
        except Exception:
            return False
