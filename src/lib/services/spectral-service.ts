import * as math from 'mathjs';
import { createServerSupabaseClient } from '../supabase/server';

export interface SpectralSubspace {
  id?: string;
  domain_name: string;
  eigenvectors: number[][]; // Principal components
  eigenvalues: number[];
  mean_embedding: number[];
  basis_rank: number;
}

export class SpectralService {
  /**
   * Re-calculates the spectral subspace for a domain based on a collection of embeddings.
   * This should be called whenever a significant number of new validated ideas are saved.
   */
  async updateDomainSubspace(domain: string, embeddings: number[][]): Promise<SpectralSubspace | null> {
    if (embeddings.length < 2) {
      console.warn(`[SpectralService] Not enough embeddings to compute subspace for domain: ${domain}`);
      return null;
    }

    // 1. Compute Mean
    const n = embeddings.length;
    const d = embeddings[0].length;
    const mean = new Array(d).fill(0);
    for (const e of embeddings) {
      for (let i = 0; i < d; i++) mean[i] += e[i] / n;
    }

    // 2. Center Data
    const centered = embeddings.map(e => e.map((val, i) => val - mean[i]));

    // 3. Compute Covariance Matrix (C = X^T * X / (n-1))
    // Note: With d=1536, a full covariance matrix is 1536x1536 (~2.3M elements).
    // mathjs can handle this.
    try {
      const X = math.matrix(centered);
      const Xt = math.transpose(X);
      const Cov = math.multiply(math.divide(Xt, n - 1), X) as math.Matrix;

      // 4. Perform Eigenvalue Decomposition
      const { eigenvalues, eigenvectors } = math.eigs(Cov) as any;

      // Map to a more usable format and sort by eigenvalues (descending)
      const eigenPairs = eigenvectors.map((p: any) => ({
        value: typeof p.value === 'number' ? p.value : p.value.valueOf(),
        vector: p.vector.toArray ? p.vector.toArray() : p.vector
      }));

      eigenPairs.sort((a: any, b: any) => b.value - a.value);

      // 5. Determine Rank (Thresholding eigenvalues)
      // We keep components that explain e.g. 95% of variance or above a noise floor.
      const totalVariance = eigenPairs.reduce((sum: number, p: any) => sum + p.value, 0);
      let cumulativeVariance = 0;
      let rank = 0;
      const selectedVectors: number[][] = [];
      const selectedValues: number[] = [];

      for (const pair of eigenPairs) {
        cumulativeVariance += pair.value;
        selectedVectors.push(pair.vector);
        selectedValues.push(pair.value);
        rank++;
        if (cumulativeVariance / totalVariance > 0.95) break;
      }

      const subspace: SpectralSubspace = {
        domain_name: domain,
        eigenvectors: selectedVectors,
        eigenvalues: selectedValues,
        mean_embedding: mean,
        basis_rank: rank
      };

      // 6. Persist to Supabase
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase
        .from('spectral_subspaces')
        .upsert({
          domain_name: subspace.domain_name,
          eigenvectors: subspace.eigenvectors,
          eigenvalues: subspace.eigenvalues,
          mean_embedding: subspace.mean_embedding,
          basis_rank: subspace.basis_rank,
          updated_at: new Date().toISOString()
        }, { onConflict: 'domain_name' });

      if (error) {
        console.error(`[SpectralService] Failed to persist subspace for ${domain}:`, error.message);
      }

      return subspace;
    } catch (err) {
      console.error(`[SpectralService] Mathematical failure:`, err);
      return null;
    }
  }

  /**
   * Projects an embedding into the Null Space of all existing domain subspaces.
   * This effectively "repels" the new embedding from existing knowledge clusters.
   */
  async projectToNullSpace(embedding: number[]): Promise<number[]> {
    const subspaces = await this.getAllSubspaces();
    let residual = [...embedding];

    for (const sub of subspaces) {
      // P = sum(v_i * v_i^T) for orthogonal eigenvectors
      for (const v of sub.eigenvectors) {
        const dot = this.dotProduct(residual, v);
        // Residual = Residual - Projection
        for (let i = 0; i < residual.length; i++) {
          residual[i] -= dot * v[i];
        }
      }
    }

    return residual;
  }

  /**
   * Measures how much a new embedding interferes with existing domains.
   */
  async calculateInterference(embedding: number[]): Promise<Map<string, number>> {
    const subspaces = await this.getAllSubspaces();
    const interference = new Map<string, number>();

    for (const sub of subspaces) {
      let projectionStrength = 0;
      for (const v of sub.eigenvectors) {
        const dot = this.dotProduct(embedding, v);
        projectionStrength += Math.abs(dot);
      }
      interference.set(sub.domain_name, projectionStrength);
    }

    return interference;
  }

  public async getAllSubspaces(): Promise<SpectralSubspace[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('spectral_subspaces')
      .select('*');

    if (error || !data) return [];

    return data.map(row => ({
      ...row,
      eigenvectors: row.eigenvectors as number[][]
    }));
  }

  private dotProduct(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
  }
}
