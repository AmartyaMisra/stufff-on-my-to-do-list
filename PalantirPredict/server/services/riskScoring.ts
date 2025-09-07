import { mlAnalysisService } from './mlAnalysis.js';

interface RiskFactors {
  textAnalysis?: {
    sentiment: number;
    categories: Record<string, number>;
    riskTokens: Array<{ token: string; weight: number }>;
  };
  behavioralAnomaly?: number;
  graphCentrality?: number;
  temporalPatterns?: {
    frequencyAnomaly: number;
    timePatternAnomaly: number;
  };
  networkFeatures?: {
    ipReputation: number;
    geoAnomaly: number;
    deviceAnomaly: number;
  };
}

interface RiskExplanation {
  score: number;
  confidence: number;
  factors: Array<{
    name: string;
    weight: number;
    contribution: number;
    evidence: string;
  }>;
  uncertainty: number;
}

export class RiskScoringService {
  // Meta-classifier for risk scoring
  calculateRiskScore(factors: RiskFactors): RiskExplanation {
    const riskFactors: Array<{ name: string; weight: number; contribution: number; evidence: string }> = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Text analysis contribution
    if (factors.textAnalysis) {
      const textScore = this.calculateTextRiskScore(factors.textAnalysis);
      const weight = 0.3;
      totalScore += textScore * weight;
      totalWeight += weight;
      
      riskFactors.push({
        name: 'Text Analysis',
        weight,
        contribution: textScore,
        evidence: `Risk tokens detected: ${factors.textAnalysis.riskTokens.map(t => t.token).join(', ')}`
      });
    }

    // Behavioral anomaly contribution
    if (factors.behavioralAnomaly !== undefined) {
      const weight = 0.25;
      totalScore += factors.behavioralAnomaly * weight;
      totalWeight += weight;
      
      riskFactors.push({
        name: 'Behavioral Anomaly',
        weight,
        contribution: factors.behavioralAnomaly,
        evidence: `Anomaly score: ${(factors.behavioralAnomaly * 100).toFixed(1)}%`
      });
    }

    // Graph centrality contribution
    if (factors.graphCentrality !== undefined) {
      const centralityScore = Math.min(1, factors.graphCentrality / 10); // Normalize
      const weight = 0.2;
      totalScore += centralityScore * weight;
      totalWeight += weight;
      
      riskFactors.push({
        name: 'Graph Centrality',
        weight,
        contribution: centralityScore,
        evidence: `Centrality score: ${factors.graphCentrality.toFixed(2)}`
      });
    }

    // Temporal patterns contribution
    if (factors.temporalPatterns) {
      const temporalScore = (factors.temporalPatterns.frequencyAnomaly + factors.temporalPatterns.timePatternAnomaly) / 2;
      const weight = 0.15;
      totalScore += temporalScore * weight;
      totalWeight += weight;
      
      riskFactors.push({
        name: 'Temporal Patterns',
        weight,
        contribution: temporalScore,
        evidence: `Frequency anomaly: ${(factors.temporalPatterns.frequencyAnomaly * 100).toFixed(1)}%`
      });
    }

    // Network features contribution
    if (factors.networkFeatures) {
      const networkScore = (factors.networkFeatures.ipReputation + factors.networkFeatures.geoAnomaly + factors.networkFeatures.deviceAnomaly) / 3;
      const weight = 0.1;
      totalScore += networkScore * weight;
      totalWeight += weight;
      
      riskFactors.push({
        name: 'Network Features',
        weight,
        contribution: networkScore,
        evidence: `IP reputation: ${(factors.networkFeatures.ipReputation * 100).toFixed(1)}%`
      });
    }

    // Normalize score
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const finalScore = Math.min(100, Math.max(0, normalizedScore * 100));

    // Calculate confidence based on feature availability and consistency
    const confidence = this.calculateConfidence(riskFactors, finalScore);
    
    // Calculate uncertainty
    const uncertainty = this.calculateUncertainty(riskFactors);

    return {
      score: finalScore,
      confidence,
      factors: riskFactors,
      uncertainty
    };
  }

  private calculateTextRiskScore(textAnalysis: RiskFactors['textAnalysis']): number {
    if (!textAnalysis) return 0;

    let score = 0;

    // Risk tokens contribute heavily
    const tokenScore = textAnalysis.riskTokens.reduce((sum, token) => sum + token.weight, 0);
    score += Math.min(1, tokenScore);

    // High-risk categories
    const criticalCategories = ['cyber_attack', 'violence', 'coordination'];
    const categoryScore = criticalCategories.reduce((sum, cat) => {
      return sum + (textAnalysis.categories[cat] || 0);
    }, 0) / criticalCategories.length;
    
    score += categoryScore * 0.8;

    // Negative sentiment contributes to risk
    if (textAnalysis.sentiment < -0.3) {
      score += Math.abs(textAnalysis.sentiment) * 0.3;
    }

    return Math.min(1, score);
  }

  private calculateConfidence(factors: Array<{ weight: number; contribution: number }>, finalScore: number): number {
    // More factors = higher confidence
    const factorCount = factors.length;
    const factorConfidence = Math.min(1, factorCount / 5);

    // Consistency between factors
    const avgContribution = factors.reduce((sum, f) => sum + f.contribution, 0) / factors.length;
    const variance = factors.reduce((sum, f) => sum + Math.pow(f.contribution - avgContribution, 2), 0) / factors.length;
    const consistencyConfidence = Math.max(0.1, 1 - Math.sqrt(variance));

    // Score magnitude confidence (extreme scores are less reliable)
    const extremeness = Math.abs(finalScore - 50) / 50;
    const magnitudeConfidence = Math.max(0.3, 1 - extremeness * 0.3);

    return (factorConfidence + consistencyConfidence + magnitudeConfidence) / 3;
  }

  private calculateUncertainty(factors: Array<{ weight: number; contribution: number }>): number {
    if (factors.length === 0) return 1;

    // Uncertainty increases with factor disagreement
    const avgContribution = factors.reduce((sum, f) => sum + f.contribution, 0) / factors.length;
    const variance = factors.reduce((sum, f) => sum + Math.pow(f.contribution - avgContribution, 2), 0) / factors.length;
    
    return Math.min(1, Math.sqrt(variance) * 2);
  }

  // Calibrate probability outputs using isotonic regression simulation
  calibrateScore(rawScore: number, historicalData?: Array<{ score: number; outcome: boolean }>): number {
    // Simple calibration - in production would use proper isotonic regression
    if (!historicalData || historicalData.length === 0) {
      return rawScore;
    }

    // Find similar historical scores and their outcomes
    const similar = historicalData.filter(h => Math.abs(h.score - rawScore) <= 10);
    if (similar.length === 0) return rawScore;

    const truePositiveRate = similar.filter(h => h.outcome).length / similar.length;
    
    // Adjust score based on historical performance
    return rawScore * 0.7 + truePositiveRate * 100 * 0.3;
  }

  // Determine alert priority based on risk score
  determinePriority(score: number, confidence: number): string {
    if (score >= 90 && confidence >= 0.8) return 'CRITICAL';
    if (score >= 70 && confidence >= 0.6) return 'HIGH';
    if (score >= 40 && confidence >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  // Generate evidence chain for explainability
  generateEvidenceChain(factors: RiskFactors, events: Array<{ timestamp: Date; type: string; description: string }>): Array<{
    timestamp: string;
    type: string;
    description: string;
    impact: number;
  }> {
    const evidence = [];

    // Add events as evidence
    events.forEach(event => {
      evidence.push({
        timestamp: event.timestamp.toISOString(),
        type: event.type,
        description: event.description,
        impact: 0.5 // Base impact
      });
    });

    // Add analysis-based evidence
    if (factors.textAnalysis?.riskTokens.length) {
      evidence.push({
        timestamp: new Date().toISOString(),
        type: 'text_analysis',
        description: `Risk keywords detected: ${factors.textAnalysis.riskTokens.map(t => t.token).join(', ')}`,
        impact: Math.max(...factors.textAnalysis.riskTokens.map(t => t.weight))
      });
    }

    if (factors.behavioralAnomaly && factors.behavioralAnomaly > 0.6) {
      evidence.push({
        timestamp: new Date().toISOString(),
        type: 'behavioral_anomaly',
        description: `Unusual behavioral pattern detected (${(factors.behavioralAnomaly * 100).toFixed(1)}% anomaly score)`,
        impact: factors.behavioralAnomaly
      });
    }

    return evidence.sort((a, b) => b.impact - a.impact);
  }
}

export const riskScoringService = new RiskScoringService();
