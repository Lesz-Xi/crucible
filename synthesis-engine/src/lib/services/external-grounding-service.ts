/**
 * External Grounding Service
 * Provides real-world scientific validation by cross-referencing generated entities
 * with authoritative databases (PubChem, BioServices).
 */

export interface GroundingResult {
  verified: boolean;
  source: string;
  externalId?: string;
  metadata?: any;
  error?: string;
}

export class ExternalGroundingService {
  private static instance: ExternalGroundingService;
  private cache: Map<string, GroundingResult> = new Map();
  private lastRequestTime: number = 0;
  private minRequestInterval: number = 250; // 4 requests per second (safe limit for PubChem)

  private constructor() {}

  public static getInstance(): ExternalGroundingService {
    if (!ExternalGroundingService.instance) {
      ExternalGroundingService.instance = new ExternalGroundingService();
    }
    return ExternalGroundingService.instance;
  }

  /**
   * Verify a chemical reagent name via PubChem
   */
  async verifyReagent(name: string): Promise<GroundingResult> {
    const cleanName = name.trim().toLowerCase();
    
    // Check cache
    if (this.cache.has(cleanName)) {
      return this.cache.get(cleanName)!;
    }

    try {
      // Rate limiting
      await this.enforceRateLimit();

      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanName)}/JSON`;
      const response = await fetch(url);

      if (response.status === 404) {
        const result: GroundingResult = { verified: false, source: 'PubChem', error: 'Compound not found' };
        this.cache.set(cleanName, result);
        return result;
      }

      if (!response.ok) {
        throw new Error(`PubChem API error: ${response.statusText}`);
      }

      const data = await response.json();
      const cid = data.PC_Compounds?.[0]?.id?.id?.cid;

      if (cid) {
        const result: GroundingResult = {
          verified: true,
          source: 'PubChem',
          externalId: `CID:${cid}`,
          metadata: {
            name: data.PC_Compounds[0].props?.find((p: any) => p.urn?.label === 'IUPAC Name')?.value?.sval
          }
        };
        this.cache.set(cleanName, result);
        return result;
      }

      return { verified: false, source: 'PubChem', error: 'No CID returned' };

    } catch (error) {
      console.error(`[ExternalGrounding] Verification failed for ${name}:`, error);
      return { 
        verified: false, 
        source: 'PubChem', 
        error: error instanceof Error ? error.message : 'Unknown network error' 
      };
    }
  }

  private async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}
