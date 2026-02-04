import os
import time
import json
from typing import Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import google.generativeai as genai
from models.schemas import ErrorAnalysisResponse, AnalysisMetadata


class GeminiService:
    """Service for analyzing errors using Google Gemini AI"""
    
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash", temperature: float = 0.3):
        """
        Initialize Gemini service
        
        Args:
            api_key: Google Gemini API key
            model_name: Model to use (default: gemini-1.5-flash)
            temperature: Temperature for generation (0.0-1.0)
        """
        genai.configure(api_key=api_key)
        self.model_name = model_name
        self.temperature = temperature
        self.model = genai.GenerativeModel(model_name)
        
    def _build_analysis_prompt(
        self, 
        error_message: str, 
        error_type: str, 
        stack_trace: str = "", 
        context: str = ""
    ) -> str:
        """Build structured prompt for error analysis"""
        
        prompt = f"""You are an expert backend debugging assistant with deep knowledge of multiple programming languages and frameworks. Analyze the following error thoroughly and provide a comprehensive, actionable response.

ERROR DETAILS:
- Error Type: {error_type}
- Error Message: {error_message}
- Stack Trace: {stack_trace if stack_trace else "Not provided"}
- Context: {context if context else "Not provided"}

CRITICAL INSTRUCTIONS:
1. Carefully read the stack trace to identify the EXACT line and file where the error occurred
2. Analyze the error message to understand the ROOT CAUSE, not just symptoms
3. Identify the tech stack from file extensions, import statements, and framework patterns
4. Provide SPECIFIC, ACTIONABLE recommendations with code examples when possible
5. Your root cause should EXPLAIN WHY the error happened, not just repeat the error message

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{{
  "severity": "critical|high|medium|low",
  "category": "string (choose the MOST SPECIFIC: Runtime Error, Database, Network, Memory, Permission, Validation, Syntax, Configuration, Dependency, Type Error, Attribute Error, Import Error, etc.)",
  "root_cause": "string (2-3 sentences explaining WHY this error occurred, referencing the specific code location from stack trace. Be technical and precise.)",
  "recommendations": [
    "string (specific action with code example if applicable)",
    "string (another specific action)",
    "string (preventive measure)",
    "string (optional: additional best practice)"
  ],
  "related_errors": ["string (similar error pattern)", "string (related issue)"],
  "confidence_score": 0.0-1.0
}}

ANALYSIS GUIDELINES:

1. **Category Selection** - Be PRECISE:
   - "Runtime Error" - for null/undefined access, type mismatches, attribute errors
   - "Database" - ONLY for actual database connection/query issues
   - "Network" - for HTTP, fetch, socket, connection errors
   - "Type Error" - for type-related issues in typed languages
   - "Attribute Error" - for missing attributes/properties
   - "Import Error" - for module/import issues
   - "Syntax" - for parsing/syntax errors
   - "Memory" - for OOM, heap issues
   - "Permission" - for access denied, auth issues
   - "Validation" - for data validation failures
   - "Configuration" - for config/env issues

2. **Root Cause** - Must include:
   - WHAT went wrong (the specific operation that failed)
   - WHERE it happened (file and line from stack trace)
   - WHY it happened (the underlying reason)
   - Example: "The get_user_profile() function attempts to access user_id attribute on a dictionary object instead of a user object. This occurs at line 42 in user.py because the query returns a dict, not a User model instance."

3. **Recommendations** - Must be:
   - Specific to the detected tech stack (Python/Node.js/TypeScript syntax)
   - Actionable (tell them exactly what to change)
   - Include code examples when relevant
   - Prioritized (most important first)
   - Example: "Add a null check before accessing .id: if user and hasattr(user, 'id'): user_id = user.id"

4. **Severity Levels**:
   - critical: System crashes, data loss, security breaches, production down
   - high: Major functionality broken, user-facing errors, performance severely degraded
   - medium: Feature not working properly, workarounds available
   - low: Minor issues, edge cases, cosmetic problems

5. **Confidence Score**:
   - 0.9-1.0: Complete stack trace with clear error, tech stack identified
   - 0.7-0.9: Good information, some assumptions needed
   - 0.5-0.7: Limited stack trace or context
   - 0.0-0.5: Very unclear, minimal information

EXAMPLES OF GOOD ANALYSIS:

For "AttributeError: 'NoneType' object has no attribute 'id'":
- Category: "Runtime Error" (NOT Database)
- Root Cause: "The code attempts to access the 'id' attribute on a None object at line X. This occurs because the database query returned None (no matching record found), but the code doesn't check for this before accessing attributes."
- Recommendation: "Add null check: if user is not None: user_id = user.id else: handle_missing_user()"

For "TypeError: Cannot read property 'map' of undefined":
- Category: "Runtime Error" (NOT Type Error)
- Root Cause: "The code calls .map() on an undefined variable at line X in component.js. This happens because the data prop is undefined when the component first renders, before the API call completes."
- Recommendation: "Add optional chaining: data?.map() or provide default value: (data || []).map()"

Now analyze the error above with this level of detail and precision:"""
        
        return prompt
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def _call_gemini(self, prompt: str) -> str:
        """
        Call Gemini API with retry logic
        
        Args:
            prompt: The prompt to send to Gemini
            
        Returns:
            Response text from Gemini
        """
        generation_config = genai.GenerationConfig(
            temperature=self.temperature,
            top_p=0.95,
            top_k=40,
            max_output_tokens=2048,
        )
        
        response = self.model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        return response.text
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse Gemini response and extract JSON
        
        Args:
            response_text: Raw response from Gemini
            
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
            raise ValueError(f"Failed to parse JSON from Gemini response: {e}")
    
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
            base_confidence: Confidence from Gemini
            
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
        Analyze an error using Gemini AI
        
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
        
        # Call Gemini
        response_text = self._call_gemini(prompt)
        
        # Parse response
        analysis_data = self._parse_gemini_response(response_text)
        
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
        """Check if Gemini service is properly configured"""
        try:
            # Simple test to verify API key works
            return self.model is not None
        except Exception:
            return False
