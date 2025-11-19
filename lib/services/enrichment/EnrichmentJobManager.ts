/**
 * Enrichment Job Manager
 * Manages in-memory job tracking for contact enrichment
 * For production, consider migrating to Redis for persistence
 */

import type { EnrichedRecord } from './agents/Gemini3ContactEnrichmentAgent';

export interface EnrichmentJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  totalRecords: number;
  completedRecords: number;
  currentRecord?: string;
  message?: string;
  results: EnrichedRecord[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class EnrichmentJobManager {
  private jobs: Map<string, EnrichmentJob> = new Map();
  private readonly JOB_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create a new enrichment job
   */
  createJob(recordCount: number): string {
    const jobId = `enrich_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: EnrichmentJob = {
      id: jobId,
      status: 'processing',
      totalRecords: recordCount,
      completedRecords: 0,
      results: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.jobs.set(jobId, job);
    
    // Schedule cleanup
    setTimeout(() => {
      this.deleteJob(jobId);
    }, this.JOB_EXPIRATION_MS);
    
    console.log(`[Job Manager] Created job: ${jobId} (${recordCount} records)`);
    
    return jobId;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): EnrichmentJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update job progress
   */
  updateProgress(
    jobId: string,
    completedRecords: number,
    currentRecord?: string,
    message?: string
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.completedRecords = completedRecords;
    job.currentRecord = currentRecord;
    job.message = message;
    job.updatedAt = new Date();

    this.jobs.set(jobId, job);
  }

  /**
   * Add enrichment result
   */
  addResult(jobId: string, result: EnrichedRecord): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.results.push(result);
    job.completedRecords = job.results.length;
    job.updatedAt = new Date();

    // Check if job is complete
    if (job.completedRecords >= job.totalRecords) {
      job.status = 'completed';
      job.message = `Completed ${job.completedRecords}/${job.totalRecords} records`;
    }

    this.jobs.set(jobId, job);
  }

  /**
   * Mark job as failed
   */
  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    job.updatedAt = new Date();

    this.jobs.set(jobId, job);
    
    console.error(`[Job Manager] Job failed: ${jobId} - ${error}`);
  }

  /**
   * Mark job as completed
   */
  completeJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.updatedAt = new Date();

    this.jobs.set(jobId, job);
    
    console.log(`[Job Manager] Job completed: ${jobId}`);
  }

  /**
   * Delete job
   */
  deleteJob(jobId: string): void {
    this.jobs.delete(jobId);
    console.log(`[Job Manager] Deleted job: ${jobId}`);
  }

  /**
   * Get all jobs (for debugging)
   */
  getAllJobs(): EnrichmentJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Clean up expired jobs
   */
  cleanupExpiredJobs(): void {
    const now = Date.now();
    const expiredJobs: string[] = [];

    this.jobs.forEach((job, jobId) => {
      const age = now - job.createdAt.getTime();
      if (age > this.JOB_EXPIRATION_MS) {
        expiredJobs.push(jobId);
      }
    });

    expiredJobs.forEach(jobId => this.deleteJob(jobId));

    if (expiredJobs.length > 0) {
      console.log(`[Job Manager] Cleaned up ${expiredJobs.length} expired jobs`);
    }
  }
}

// Singleton instance
export const enrichmentJobManager = new EnrichmentJobManager();

// Cleanup expired jobs every hour
setInterval(() => {
  enrichmentJobManager.cleanupExpiredJobs();
}, 60 * 60 * 1000);
