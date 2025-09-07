interface TextAnalysisResult {
  sentiment: number; // -1 to 1
  categories: Record<string, number>; // category -> confidence
  keywords: string[];
  riskTokens: Array<{ token: string; weight: number }>;
}

interface BehavioralFeatures {
  sessionLength: number;
  deviceChurn: number;
  geoJump: boolean;
  timePattern: string;
  volumeAnomaly: number;
}

export class MLAnalysisService {
  // NLP Analysis using simple keyword-based approach (in production would use transformers)
  analyzeText(text: string): TextAnalysisResult {
    const lowerText = text.toLowerCase();
    
    // Risk keywords with weights
    const riskKeywords: Record<string, number> = {
      'attack': 0.9,
      'bomb': 0.95,
      'coordinate': 0.7,
      'hack': 0.8,
      'exploit': 0.75,
      'breach': 0.8,
      'infiltrate': 0.85,
      'sabotage': 0.8,
      'disrupt': 0.6,
      'threat': 0.7,
      'malware': 0.85,
      'virus': 0.8,
      'trojan': 0.8,
      'ransomware': 0.9,
      'ddos': 0.85
    };

    // Category classifiers (simplified zero-shot)
    const categories: Record<string, number> = {
      'cyber_attack': 0,
      'fraud': 0,
      'violence': 0,
      'political_mobilization': 0,
      'coordination': 0
    };

    const riskTokens: Array<{ token: string; weight: number }> = [];
    const keywords: string[] = [];

    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success'];
    const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'failure', 'attack', 'threat'];
    
    let sentimentScore = 0;
    const words = lowerText.split(/\s+/);
    
    words.forEach(word => {
      if (positiveWords.includes(word)) sentimentScore += 0.1;
      if (negativeWords.includes(word)) sentimentScore -= 0.1;
      
      if (riskKeywords[word]) {
        riskTokens.push({ token: word, weight: riskKeywords[word] });
        keywords.push(word);
        
        // Update categories based on keywords
        if (['attack', 'hack', 'exploit', 'malware', 'ddos'].includes(word)) {
          categories['cyber_attack'] += riskKeywords[word];
        }
        if (['coordinate', 'organize', 'plan'].includes(word)) {
          categories['coordination'] += riskKeywords[word];
        }
        if (['bomb', 'violence', 'threat'].includes(word)) {
          categories['violence'] += riskKeywords[word];
        }
      }
    });

    // Normalize sentiment to -1 to 1 range
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

    // Normalize categories to 0-1 range
    Object.keys(categories).forEach(key => {
      categories[key] = Math.min(1, categories[key]);
    });

    return {
      sentiment: sentimentScore,
      categories,
      keywords,
      riskTokens
    };
  }

  // Behavioral anomaly detection
  detectBehavioralAnomalies(features: BehavioralFeatures): number {
    let anomalyScore = 0;

    // Session length anomaly
    if (features.sessionLength > 3600) { // > 1 hour
      anomalyScore += 0.3;
    }

    // Device churn (new devices frequently)
    if (features.deviceChurn > 5) {
      anomalyScore += 0.4;
    }

    // Geographic jump
    if (features.geoJump) {
      anomalyScore += 0.5;
    }

    // Time pattern anomaly (activity at unusual hours)
    if (features.timePattern === 'unusual') {
      anomalyScore += 0.2;
    }

    // Volume anomaly
    anomalyScore += Math.min(0.4, features.volumeAnomaly);

    return Math.min(1, anomalyScore);
  }

  // Simple isolation forest simulation for anomaly detection
  isolationForest(features: number[]): number {
    // Simplified isolation forest - in production would use proper implementation
    const avgPath = features.reduce((sum, f) => sum + Math.abs(f), 0) / features.length;
    const normalizedPath = avgPath / 10; // Normalize to expected range
    
    // Anomaly score: higher path length = lower anomaly
    return Math.max(0, Math.min(1, 1 - normalizedPath));
  }

  // Leet speak decoder
  decodeLeetSpeak(text: string): string {
    const leetMap: Record<string, string> = {
      '0': 'o',
      '1': 'i',
      '3': 'e',
      '4': 'a',
      '5': 's',
      '7': 't',
      '@': 'a',
      '$': 's'
    };

    return text.replace(/[0137459@$]/g, char => leetMap[char] || char);
  }

  // Calculate confidence interval for predictions
  calculateConfidence(features: number[], prediction: number): number {
    const variance = features.reduce((sum, f) => sum + Math.pow(f - prediction, 2), 0) / features.length;
    const uncertainty = Math.sqrt(variance);
    
    // Convert uncertainty to confidence (0-1)
    return Math.max(0.1, Math.min(1, 1 - uncertainty));
  }
}

export const mlAnalysisService = new MLAnalysisService();
