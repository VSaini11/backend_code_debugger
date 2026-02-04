export interface AnalysisResult {
  severity: 'critical' | 'high' | 'medium' | 'low';
  rootCause: string;
  recommendations: string[];
  relatedErrors: string[];
  category: string;
  confidenceScore?: number;
  analysisMetadata?: {
    model: string;
    timestamp: number;
    processingTimeMs: number;
  };
}

// FastAPI backend URL - can be configured via environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Analyze error using FastAPI backend with Gemini AI
 */
export const analyzeError = async (
  errorMessage: string,
  errorType: string,
  stackTrace: string,
  context: string
): Promise<AnalysisResult> => {
  try {
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error_message: errorMessage,
        error_type: errorType,
        stack_trace: stackTrace,
        context: context,
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform snake_case to camelCase for frontend
    return {
      severity: data.severity,
      category: data.category,
      rootCause: data.root_cause,
      recommendations: data.recommendations,
      relatedErrors: data.related_errors,
      confidenceScore: data.confidence_score,
      analysisMetadata: data.analysis_metadata ? {
        model: data.analysis_metadata.model,
        timestamp: data.analysis_metadata.timestamp,
        processingTimeMs: data.analysis_metadata.processing_time_ms,
      } : undefined,
    };
  } catch (error) {
    console.error('❌ Error calling analysis API:', error);
    console.error('API URL:', `${API_URL}/api/analyze`);
    console.error('Error details:', error instanceof Error ? error.message : String(error));

    // Fallback to basic pattern-based analysis if API fails
    console.warn('⚠️ Falling back to pattern-based analysis');
    return fallbackAnalyzer(errorMessage, errorType, stackTrace, context);
  }
};

/**
 * Fallback analyzer using pattern matching (used when API is unavailable)
 */
const fallbackAnalyzer = (
  errorMessage: string,
  errorType: string,
  stackTrace: string,
  context: string
): AnalysisResult => {
  const fullText = `${errorMessage} ${errorType} ${stackTrace} ${context}`.toLowerCase();

  const ERROR_PATTERNS = {
    database: {
      keywords: ['connection', 'timeout', 'pool', 'database', 'query', 'transaction', 'constraint'],
      severity: 'high' as const,
      category: 'Database',
      recommendations: [
        'Check database connection string and credentials',
        'Verify database server is running and accessible',
        'Review query performance and optimize if needed',
        'Check for connection pool exhaustion',
      ],
    },
    network: {
      keywords: ['fetch', 'http', 'socket', 'econnrefused', 'timeout', 'enotfound', 'cors'],
      severity: 'high' as const,
      category: 'Network',
      recommendations: [
        'Verify network connectivity and DNS resolution',
        'Check endpoint URL and port are correct',
        'Review CORS policies if applicable',
        'Increase timeout duration if requests take longer',
      ],
    },
    runtime: {
      keywords: ['undefined', 'null', 'typeerror', 'cannot read', 'not a function', 'reference'],
      severity: 'high' as const,
      category: 'Runtime',
      recommendations: [
        'Add null/undefined checks before property access',
        'Use optional chaining (?.) and nullish coalescing (??)',
        'Enable strict mode and TypeScript strict checks',
        'Add type guards and runtime validation',
      ],
    },
  };

  // Find best matching pattern
  let bestMatch = ERROR_PATTERNS.runtime;
  let maxMatches = 0;

  for (const pattern of Object.values(ERROR_PATTERNS)) {
    const matchCount = pattern.keywords.filter(kw => fullText.includes(kw)).length;
    if (matchCount > maxMatches) {
      maxMatches = matchCount;
      bestMatch = pattern;
    }
  }

  return {
    severity: bestMatch.severity,
    category: bestMatch.category,
    rootCause: `${errorType}: ${errorMessage}`,
    recommendations: bestMatch.recommendations,
    relatedErrors: [],
    confidenceScore: 0.5, // Low confidence for fallback
  };
};

export const calculateSeverityScore = (severity: string): number => {
  const SEVERITY_SCORES: Record<string, number> = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
  };
  return SEVERITY_SCORES[severity.toLowerCase()] || 0;
};

