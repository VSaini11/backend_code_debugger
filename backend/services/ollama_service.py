import time
import json
import requests
from typing import Dict, Any
from models.schemas import ErrorAnalysisResponse, AnalysisMetadata


class OllamaService:
    """Service for analyzing errors using local Ollama models"""
    
    def __init__(self, model_name: str = "phi3:mini", base_url: str = "http://localhost:11434", temperature: float = 0.3):
        """
        Initialize Ollama service for local AI
        
        Args:
            model_name: Model to use (default: phi3:mini)
            base_url: Ollama API URL (default: http://localhost:11434)
            temperature: Temperature for generation (0.0-1.0)
        
        Recommended FREE local models:
        - phi3:mini (2.7GB) - FASTEST, great quality, runs on any laptop
        - mistral:7b (4.1GB) - Excellent quality, good speed
        - llama3.2:3b (2GB) - Very fast, good quality
        - qwen2.5-coder:7b (4.7GB) - Best for code analysis
        - codellama:7b (3.8GB) - Specialized for code
        """
        self.model_name = model_name
        self.base_url = base_url.rstrip('/')
        self.temperature = temperature
        
    def _build_analysis_prompt(
        self, 
        error_message: str, 
        error_type: str, 
        stack_trace: str = "", 
        context: str = ""
    ) -> str:
        """Build structured prompt for error analysis"""
        
        prompt = f"""You are a backend debugging assistant used by professional software engineers.

Your task is NOT to restate the error.
Your task is to explain WHY the error occurred and HOW to fix it.

IMPORTANT BEHAVIOR RULES:
1. Do NOT repeat the error message as the root cause.
2. Identify the failure point in the code flow (assumption that failed).
3. Classify the issue using an industry-friendly category
   (e.g., Runtime Error – Null Reference, Database Error – Constraint).
4. If the error is a null/undefined access, focus on missing validation,
   not database connectivity unless explicitly stated.
5. Recommendations must directly solve the identified root cause.
6. If information is missing, state assumptions briefly and reduce confidence.
7. Be concise and developer-focused. No generic advice.

ERROR DETAILS:
- Error Type: {error_type}
- Error Message: {error_message}
- Stack Trace: {stack_trace if stack_trace else "Not provided"}
- Context: {context if context else "Not provided"}

REQUIRED OUTPUT STRUCTURE (JSON only, no markdown):
{{
  "severity": "critical|high|medium|low",
  "category": "string (industry-friendly, e.g., 'Runtime Error – Null Reference', 'Database Error – Constraint Violation', 'Network Error – Timeout')",
  "root_cause": "string (WHY it happened - identify the failed assumption or missing validation, NOT a restatement of the error)",
  "recommendations": [
    "string (specific fix with code example)",
    "string (preventive measure)",
    "string (optional: best practice)"
  ],
  "related_errors": ["string (similar pattern)", "string (related issue)"],
  "confidence_score": 0.0-1.0
}}

ANALYSIS GUIDELINES:

1. **Category** - Use industry-friendly format:
   - "Runtime Error – Null Reference" (not just "Runtime Error")
   - "Database Error – Constraint Violation" (not just "Database")
   - "Network Error – Connection Timeout"
   - "Type Error – Invalid Cast"
   - "Attribute Error – Missing Property"

2. **Root Cause** - Explain WHY (the failed assumption):
   ❌ BAD: "The code attempts to access the 'id' attribute on a None object"
   ✅ GOOD: "The code assumes the database query will always return a user object, but it returns None when no matching record exists. The code lacks null validation before accessing attributes."
   
   Focus on:
   - What assumption failed?
   - What validation is missing?
   - What state was unexpected?

3. **Recommendations** - Direct solutions with code:
   - Must include code examples in the detected language
   - Must directly fix the root cause
   - Prioritize immediate fix, then prevention

4. **Severity**:
   - critical: Production down, data loss, security breach
   - high: Major functionality broken, user-facing
   - medium: Feature degraded, workarounds exist
   - low: Minor issue, edge case

5. **Confidence Score** (0.0-1.0):
   - 0.80-0.95: Complete stack trace + clear pattern
   - 0.60-0.79: Partial context, some assumptions
   - 0.00-0.59: Limited info, high uncertainty

EXAMPLES:

Example 1 - Null Reference:
Input: AttributeError: 'NoneType' object has no attribute 'id'
Stack: File "app/routes/user.py", line 42, in get_user_profile: user_id = user.id

Output:
{{
  "category": "Runtime Error – Null Reference",
  "root_cause": "The code assumes the database query will always return a user object, but it returns None when no matching record exists. Missing null validation before attribute access.",
  "recommendations": [
    "Add null check: if user is None: raise HTTPException(404, 'User not found')",
    "Use Optional type hint: def get_user(id: int) -> Optional[User]",
    "Add database existence check before query"
  ],
  "confidence_score": 0.88
}}

Now analyze the error above. Respond ONLY with valid JSON:"""
        
        return prompt
    
    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse Ollama response and extract JSON
        
        Args:
            response_text: Raw response from Ollama
            
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
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            raise ValueError(f"Failed to parse JSON from Ollama response: {e}\nResponse: {text[:500]}")
    
    def _calculate_confidence_adjustment(
        self, 
        error_message: str, 
        stack_trace: str, 
        context: str,
        base_confidence: float
    ) -> float:
        """Adjust confidence score based on available information"""
        adjustments = 0.0
        
        if not stack_trace or len(stack_trace.strip()) < 10:
            adjustments -= 0.1
        if not context or len(context.strip()) < 5:
            adjustments -= 0.05
        if len(error_message.strip()) < 20:
            adjustments -= 0.05
        if stack_trace and len(stack_trace.strip()) > 100:
            adjustments += 0.05
        
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
        Analyze an error using local Ollama model
        
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
        
        # Call Ollama
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": self.temperature,
                    "num_predict": 2048
                }
            },
            timeout=120  # 2 minutes timeout for local processing
        )
        
        if not response.ok:
            raise Exception(f"Ollama API error: {response.status_code} - {response.text}")
        
        response_data = response.json()
        response_text = response_data.get("response", "")
        
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
        """Check if Ollama service is running and accessible"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.ok
        except Exception:
            return False
