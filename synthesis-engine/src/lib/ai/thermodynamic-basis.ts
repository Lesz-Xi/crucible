/**
 * Thermodynamic Basis Expansion Module
 * 
 * Detects when the synthesis process is stuck in a "local optimum" 
 * (generating repetitive ideas) and triggers high-temperature exploration.
 * 
 * Based on the remediated theory:
 * "Local optima escape becomes feasible when λ_min(Σ_B) > 1/√L"
 */

import * as math from 'mathjs';
import type { NovelIdea } from '@/types';

export interface SpectralGapMetrics {
  lambda_min: number;
  lambda_max: number;
  spectralGap: number;
  conditionNumber: number;
}

export interface ThermodynamicConfig {
  /** Number of recent ideas to analyze */
  windowSize?: number;
  /** Temperature for expansion phase */
  expansionTemperature?: number;
  /** Threshold ratio for triggering expansion */
  thresholdMultiplier?: number;
}

export class ThermodynamicBasisExpansion {
  private config: Required<ThermodynamicConfig>;

  constructor(config: ThermodynamicConfig = {}) {
    this.config = {
      windowSize: config.windowSize ?? 10,
      expansionTemperature: config.expansionTemperature ?? 1.5,
      thresholdMultiplier: config.thresholdMultiplier ?? 1.0,
    };
  }

  /**
   * Compute the spectral gap of the behavioral covariance matrix.
   * 
   * Algorithm:
   * 1. Convert ideas to embeddings (assumed to be in idea.embedding)
   * 2. Compute covariance matrix Σ_B
   * 3. Eigenvalue decomposition
   * 4. Extract λ_min and λ_max
   */
  computeSpectralGap(ideas: NovelIdea[]): SpectralGapMetrics {
    if (ideas.length < 2) {
      // Not enough data for covariance
      return {
        lambda_min: 1.0,
        lambda_max: 1.0,
        spectralGap: 1.0,
        conditionNumber: 1.0,
      };
    }

    // Take the most recent window
    const recentIdeas = ideas.slice(-this.config.windowSize);

    // Extract embeddings (assumed to exist from embedding-service)
    // For now, we'll use a simple proxy: hash the thesis text into a vector
    const embeddings = recentIdeas.map(idea => this.ideaToEmbedding(idea));

    // Compute mean
    const mean = this.computeMean(embeddings);

    // Compute covariance matrix
    const covMatrix = this.computeCovarianceMatrix(embeddings, mean);

    // Eigenvalue decomposition
    const eigenvalues = this.computeEigenvalues(covMatrix);

    const lambda_min = Math.min(...eigenvalues);
    const lambda_max = Math.max(...eigenvalues);
    const spectralGap = lambda_max - lambda_min;
    const conditionNumber = lambda_max / (lambda_min + 1e-10);

    return {
      lambda_min,
      lambda_max,
      spectralGap,
      conditionNumber,
    };
  }

  /**
   * Estimate the Lipschitz constant of the "idea quality landscape".
   * 
   * Approximation: L ≈ max gradient difference over distance
   * We use confidence scores as a proxy for the objective function.
   */
  estimateLipschitzConstant(ideas: NovelIdea[]): number {
    if (ideas.length < 2) {
      return 1.0; // Default
    }

    const embeddings = ideas.map(idea => this.ideaToEmbedding(idea));
    const confidences = ideas.map(idea => idea.confidence / 100); // Normalize

    let maxLipschitz = 0;

    // Compute pairwise gradient differences
    for (let i = 0; i < ideas.length; i++) {
      for (let j = i + 1; j < ideas.length; j++) {
        const gradDiff = Math.abs(confidences[i] - confidences[j]);
        const distance = this.euclideanDistance(embeddings[i], embeddings[j]);
        
        if (distance > 1e-6) {
          const lipschitzEstimate = gradDiff / distance;
          maxLipschitz = Math.max(maxLipschitz, lipschitzEstimate);
        }
      }
    }

    // Return with lower bound
    return Math.max(maxLipschitz, 0.1);
  }

  /**
   * Determine if expansion should be triggered.
   * 
   * Condition: λ_min < (threshold_multiplier / √L)
   */
  shouldTriggerExpansion(gap: SpectralGapMetrics, L: number): boolean {
    const threshold = this.config.thresholdMultiplier / Math.sqrt(L);
    const shouldTrigger = gap.lambda_min < threshold;

    if (shouldTrigger) {
      console.log(`[Thermodynamic] Expansion triggered: λ_min=${gap.lambda_min.toFixed(3)} < ${threshold.toFixed(3)}`);
    }

    return shouldTrigger;
  }

  /**
   * Execute high-temperature expansion (placeholder).
   * 
   * This will be integrated with the existing MCMC exploration in synthesis-engine.
   * For now, we return a flag to enable high-temperature sampling.
   */
  async executeExpansion(
    currentIdeas: NovelIdea[],
    temperature?: number
  ): Promise<{ shouldExpand: true; temperature: number }> {
    const temp = temperature ?? this.config.expansionTemperature;
    
    console.log(`[Thermodynamic] Executing expansion phase at T=${temp}`);
    
    // Return metadata for synthesis engine to use
    return {
      shouldExpand: true,
      temperature: temp,
    };
  }

  // ========== Private Helper Methods ==========

  private ideaToEmbedding(idea: NovelIdea): number[] {
    // Simplified embedding: hash the thesis into a fixed-size vector
    // In production, this would use the actual embedding-service
    const text = idea.thesis + (idea.mechanism || '') + (idea.description || '');
    const hash = this.stringToHash(text);
    
    // Generate a pseudo-random but deterministic vector
    const dim = 64; // Embedding dimension
    const embedding: number[] = [];
    let seed = hash;
    
    for (let i = 0; i < dim; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      embedding.push(seed / 233280);
    }
    
    return embedding;
  }

  private stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private computeMean(vectors: number[][]): number[] {
    const dim = vectors[0].length;
    const mean = new Array(dim).fill(0);
    
    for (const vec of vectors) {
      for (let i = 0; i < dim; i++) {
        mean[i] += vec[i];
      }
    }
    
    for (let i = 0; i < dim; i++) {
      mean[i] /= vectors.length;
    }
    
    return mean;
  }

  private computeCovarianceMatrix(vectors: number[][], mean: number[]): number[][] {
    const dim = vectors[0].length;
    const n = vectors.length;
    const cov: number[][] = Array(dim).fill(0).map(() => Array(dim).fill(0));
    
    // Compute covariance: Σ = (1/n) * Σ (x - μ)(x - μ)^T
    for (const vec of vectors) {
      const centered = vec.map((v, i) => v - mean[i]);
      
      for (let i = 0; i < dim; i++) {
        for (let j = 0; j < dim; j++) {
          cov[i][j] += centered[i] * centered[j];
        }
      }
    }
    
    // Normalize
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        cov[i][j] /= n;
      }
    }
    
    return cov;
  }

  private computeEigenvalues(matrix: number[][]): number[] {
    try {
      // Use mathjs for eigenvalue computation
      const eigs = math.eigs(matrix);
      
      // Extract real parts and sort
      const values = eigs.values as any; // Cast to avoid Matrix type issues for now, since we only need iteration
      const valuesArray = values.toArray ? values.toArray() : values;

      const eigenvalues = valuesArray.map((v: any) => 
        typeof v === 'number' ? v : v.re || 0
      ).filter((v: number) => v > 0); // Keep only positive eigenvalues
      
      return eigenvalues.length > 0 ? eigenvalues : [1.0];
    } catch (error) {
      console.warn('[Thermodynamic] Eigenvalue computation failed, using default', error);
      return [1.0];
    }
  }

  private euclideanDistance(v1: number[], v2: number[]): number {
    let sum = 0;
    for (let i = 0; i < v1.length; i++) {
      const diff = v1[i] - v2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }
}
