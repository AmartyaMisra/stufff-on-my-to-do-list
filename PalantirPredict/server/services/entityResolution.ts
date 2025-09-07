import crypto from 'crypto';

interface EntityCandidate {
  id: string;
  similarity: number;
  attributes: Record<string, any>;
}

export class EntityResolutionService {
  // Create pseudonymous hash for PII
  createPseudonymousId(rawIdentifier: string): string {
    return crypto.createHash('sha256').update(rawIdentifier + process.env.SALT || 'default_salt').digest('hex').substring(0, 8);
  }

  // Create canonical hash for entity resolution
  createCanonicalHash(attributes: Record<string, any>): string {
    // Sort attributes for consistent hashing
    const sortedAttrs = Object.keys(attributes)
      .sort()
      .reduce((acc, key) => {
        acc[key] = attributes[key];
        return acc;
      }, {} as Record<string, any>);
    
    const canonicalString = JSON.stringify(sortedAttrs);
    return crypto.createHash('sha256').update(canonicalString).digest('hex');
  }

  // Simple string similarity (Jaccard similarity for token sets)
  calculateStringSimilarity(str1: string, str2: string): number {
    const tokens1 = new Set(str1.toLowerCase().split(/\s+/));
    const tokens2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set(Array.from(tokens1).filter(x => tokens2.has(x)));
    const union = new Set([...Array.from(tokens1), ...Array.from(tokens2)]);
    
    return intersection.size / union.size;
  }

  // Phone number similarity (last N digits)
  phoneLastDigitsSimilarity(phone1: string, phone2: string, n = 4): boolean {
    const digits1 = phone1.replace(/\D/g, '');
    const digits2 = phone2.replace(/\D/g, '');
    
    if (digits1.length < n || digits2.length < n) return false;
    
    return digits1.slice(-n) === digits2.slice(-n);
  }

  // Email domain similarity
  emailDomainSimilarity(email1: string, email2: string): boolean {
    const domain1 = email1.split('@')[1]?.toLowerCase();
    const domain2 = email2.split('@')[1]?.toLowerCase();
    
    return domain1 === domain2;
  }

  // IP subnet similarity
  ipSubnetSimilarity(ip1: string, ip2: string): boolean {
    const octets1 = ip1.split('.');
    const octets2 = ip2.split('.');
    
    if (octets1.length !== 4 || octets2.length !== 4) return false;
    
    // Check if first 3 octets match (same /24 subnet)
    return octets1.slice(0, 3).join('.') === octets2.slice(0, 3).join('.');
  }

  // Deterministic entity matching
  findDeterministicMatches(attributes: Record<string, any>, existingEntities: Array<{ id: string; attributes: Record<string, any> }>): EntityCandidate[] {
    const candidates: EntityCandidate[] = [];

    existingEntities.forEach(entity => {
      let similarity = 0;
      let matchCount = 0;

      // Exact hash matches
      if (attributes.hashedEmail && entity.attributes.hashedEmail === attributes.hashedEmail) {
        similarity += 0.9;
        matchCount++;
      }

      if (attributes.hashedPhone && entity.attributes.hashedPhone === attributes.hashedPhone) {
        similarity += 0.9;
        matchCount++;
      }

      // Phone last digits match
      if (attributes.phone && entity.attributes.phone && 
          this.phoneLastDigitsSimilarity(attributes.phone, entity.attributes.phone)) {
        similarity += 0.6;
        matchCount++;
      }

      // Email domain match
      if (attributes.email && entity.attributes.email && 
          this.emailDomainSimilarity(attributes.email, entity.attributes.email)) {
        similarity += 0.4;
        matchCount++;
      }

      // IP subnet match
      if (attributes.ipAddress && entity.attributes.ipAddress && 
          this.ipSubnetSimilarity(attributes.ipAddress, entity.attributes.ipAddress)) {
        similarity += 0.3;
        matchCount++;
      }

      if (matchCount > 0) {
        candidates.push({
          id: entity.id,
          similarity: similarity / matchCount,
          attributes: entity.attributes
        });
      }
    });

    return candidates.sort((a, b) => b.similarity - a.similarity);
  }

  // Probabilistic record linkage
  findProbabilisticMatches(attributes: Record<string, any>, existingEntities: Array<{ id: string; attributes: Record<string, any> }>): EntityCandidate[] {
    const candidates: EntityCandidate[] = [];

    existingEntities.forEach(entity => {
      let similarity = 0;
      let weightSum = 0;

      // Name similarity
      if (attributes.name && entity.attributes.name) {
        const nameSim = this.calculateStringSimilarity(attributes.name, entity.attributes.name);
        similarity += nameSim * 0.4;
        weightSum += 0.4;
      }

      // Location similarity
      if (attributes.location && entity.attributes.location) {
        const locSim = this.calculateStringSimilarity(attributes.location, entity.attributes.location);
        similarity += locSim * 0.3;
        weightSum += 0.3;
      }

      // Device fingerprint similarity
      if (attributes.deviceFingerprint && entity.attributes.deviceFingerprint) {
        const deviceSim = attributes.deviceFingerprint === entity.attributes.deviceFingerprint ? 1 : 0;
        similarity += deviceSim * 0.7;
        weightSum += 0.7;
      }

      // Behavioral pattern similarity
      if (attributes.behaviorPattern && entity.attributes.behaviorPattern) {
        const behaviorSim = this.calculateStringSimilarity(
          JSON.stringify(attributes.behaviorPattern),
          JSON.stringify(entity.attributes.behaviorPattern)
        );
        similarity += behaviorSim * 0.5;
        weightSum += 0.5;
      }

      if (weightSum > 0) {
        const normalizedSimilarity = similarity / weightSum;
        if (normalizedSimilarity > 0.3) { // Threshold for consideration
          candidates.push({
            id: entity.id,
            similarity: normalizedSimilarity,
            attributes: entity.attributes
          });
        }
      }
    });

    return candidates.sort((a, b) => b.similarity - a.similarity);
  }

  // Sanitize attributes for privacy
  sanitizeAttributes(rawAttributes: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    Object.keys(rawAttributes).forEach(key => {
      const value = rawAttributes[key];
      
      switch (key) {
        case 'email':
          sanitized.hashedEmail = this.createPseudonymousId(value);
          sanitized.emailDomain = value.split('@')[1];
          break;
        case 'phone':
          sanitized.hashedPhone = this.createPseudonymousId(value);
          sanitized.phoneLastFour = value.replace(/\D/g, '').slice(-4);
          break;
        case 'ip':
          sanitized.hashedIp = this.createPseudonymousId(value);
          sanitized.ipSubnet = value.split('.').slice(0, 3).join('.');
          break;
        case 'name':
          sanitized.hashedName = this.createPseudonymousId(value);
          break;
        default:
          // Keep non-PII attributes as-is
          if (!this.isPII(key)) {
            sanitized[key] = value;
          }
      }
    });

    return sanitized;
  }

  private isPII(key: string): boolean {
    const piiFields = ['email', 'phone', 'name', 'address', 'ssn', 'dob', 'id'];
    return piiFields.includes(key.toLowerCase());
  }
}

export const entityResolutionService = new EntityResolutionService();
