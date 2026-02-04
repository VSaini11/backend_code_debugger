import fs from 'fs';
import path from 'path';

export interface ErrorRecord {
  id: string;
  timestamp: number;
  errorMessage: string;
  errorType: string;
  stackTrace: string;
  context: string;
  analysis?: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    rootCause: string;
    recommendations: string[];
    relatedErrors: string[];
    confidenceScore?: number;
    analysisMetadata?: {
      model: string;
      timestamp: number;
      processingTimeMs: number;
    };
  };
}

const DB_FILE = path.join(process.cwd(), 'public', 'errors.json');

// Ensure directory exists
const ensureDbFile = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
  }
};

export const getAllErrors = (): ErrorRecord[] => {
  ensureDbFile();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as ErrorRecord[];
  } catch {
    return [];
  }
};

export const getErrorById = (id: string): ErrorRecord | null => {
  const errors = getAllErrors();
  return errors.find(e => e.id === id) || null;
};

export const saveError = (error: Omit<ErrorRecord, 'id' | 'timestamp'>): ErrorRecord => {
  ensureDbFile();
  const errors = getAllErrors();
  const newError: ErrorRecord = {
    ...error,
    id: Date.now().toString(),
    timestamp: Date.now(),
  };
  errors.push(newError);
  fs.writeFileSync(DB_FILE, JSON.stringify(errors, null, 2));
  return newError;
};

export const updateError = (id: string, updates: Partial<ErrorRecord>): ErrorRecord | null => {
  ensureDbFile();
  const errors = getAllErrors();
  const index = errors.findIndex(e => e.id === id);
  if (index === -1) return null;

  errors[index] = { ...errors[index], ...updates };
  fs.writeFileSync(DB_FILE, JSON.stringify(errors, null, 2));
  return errors[index];
};

export const deleteError = (id: string): boolean => {
  ensureDbFile();
  const errors = getAllErrors();
  const filtered = errors.filter(e => e.id !== id);
  if (filtered.length === errors.length) return false;

  fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2));
  return true;
};

export const getRecentErrors = (limit: number = 10): ErrorRecord[] => {
  const errors = getAllErrors();
  return errors.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
};

export const searchErrors = (query: string): ErrorRecord[] => {
  const errors = getAllErrors();
  const lowerQuery = query.toLowerCase();
  return errors.filter(e =>
    e.errorMessage.toLowerCase().includes(lowerQuery) ||
    e.errorType.toLowerCase().includes(lowerQuery) ||
    e.context.toLowerCase().includes(lowerQuery)
  );
};
