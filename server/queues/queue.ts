export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job<T = any, R = any> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: R;
  error?: string;
  attempts?: number;
  maxAttempts?: number;
  runAt?: Date;
}

export type JobHandler<T = any, R = any> = (job: Job<T, R>) => Promise<R>;

class BackgroundQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private activeWorkers = 0;
  private readonly maxConcurrency = 5;

  constructor() {
    // Automatically check for scheduled / pending jobs periodically
    setInterval(() => this.tick(), 15000);
  }

  registerHandler<T = any, R = any>(type: string, handler: JobHandler<T, R>) {
    this.handlers.set(type, handler);
    console.log(`[Queue] Registered worker handler for job type: '${type}'`);
  }

  enqueue<T = any, R = any>(type: string, data: T, options?: { maxAttempts?: number; runAt?: Date }): Job<T, R> {
    const job: Job<T, R> = {
      id: `job_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString().slice(-4)}`,
      type,
      data,
      status: "pending",
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options?.maxAttempts !== undefined ? options.maxAttempts : 3,
      runAt: options?.runAt,
    };
    this.jobs.set(job.id, job);
    console.log(`[Queue] Job ${job.id} [${type}] enqueued successfully (max attempts: ${job.maxAttempts}).`);
    
    // Process on current tick to avoid routing delay
    setImmediate(() => this.processNext());
    return job;
  }

  async enqueueAndWait<T = any, R = any>(
    type: string, 
    data: T, 
    timeoutMs = 90000, 
    options?: { maxAttempts?: number; runAt?: Date }
  ): Promise<R> {
    const job = this.enqueue<T, R>(type, data, options);
    
    return new Promise<R>((resolve, reject) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const currentJob = this.getJob(job.id);
        if (!currentJob) {
          clearInterval(interval);
          reject(new Error("Queue error: Job context deleted or not found"));
          return;
        }

        if (currentJob.status === "completed") {
          clearInterval(interval);
          resolve(currentJob.result);
          return;
        }

        if (currentJob.status === "failed") {
          clearInterval(interval);
          reject(new Error(currentJob.error || "Background execution failed. Check system logs."));
          return;
        }

        if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          reject(new Error(`Queue Timeout: Background execution exceeded limit of ${timeoutMs}ms`));
        }
      }, 50);
    });
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  private tick() {
    this.processNext();
  }

  private async processNext() {
    if (this.activeWorkers >= this.maxConcurrency) return;

    const now = new Date();
    const pendingJob = Array.from(this.jobs.values()).find(j => 
      j.status === "pending" && 
      (!j.runAt || j.runAt <= now)
    );
    
    if (!pendingJob) return;

    pendingJob.status = "processing";
    pendingJob.startedAt = new Date();
    this.activeWorkers++;

    const handler = this.handlers.get(pendingJob.type);
    if (!handler) {
      pendingJob.status = "failed";
      pendingJob.error = `Invalid execution request. No active handler registered for type: '${pendingJob.type}'`;
      pendingJob.completedAt = new Date();
      this.activeWorkers--;
      setImmediate(() => this.processNext());
      return;
    }

    // Execute handoff asynchronously to keep response cycles clean
    (async () => {
      try {
        pendingJob.attempts = (pendingJob.attempts || 0) + 1;
        console.log(`[Queue] Running Job ${pendingJob.id} [${pendingJob.type}] (Attempt ${pendingJob.attempts}/${pendingJob.maxAttempts || 3})`);

        const result = await handler(pendingJob);
        pendingJob.status = "completed";
        pendingJob.result = result;
        console.log(`[Queue] Job ${pendingJob.id} [${pendingJob.type}] completed successfully on attempt ${pendingJob.attempts}.`);
      } catch (err: any) {
        const errorMsg = err.message || String(err);
        pendingJob.error = errorMsg;
        const attempts = pendingJob.attempts || 1;
        const maxAttempts = pendingJob.maxAttempts || 3;

        if (attempts < maxAttempts) {
          // Exponential backoff with a bit of jitter
          const backoffDelay = Math.min(Math.pow(2, attempts) * 1000 + Math.floor(Math.random() * 500), 60000);
          pendingJob.status = "pending";
          pendingJob.runAt = new Date(Date.now() + backoffDelay);
          console.warn(`[Queue] Execution failure in Job ${pendingJob.id} (Attempt ${attempts}/${maxAttempts}). Retrying in ${backoffDelay}ms. Error: ${errorMsg}`);
        } else {
          pendingJob.status = "failed";
          console.error(`[Queue] Job ${pendingJob.id} exceeded maximum retry attempts (${maxAttempts}) and failed permanently. Error: ${errorMsg}`);
        }
      } finally {
        pendingJob.completedAt = new Date();
        this.activeWorkers--;
        setImmediate(() => this.processNext());
      }
    })();
  }
}

export const globalQueue = new BackgroundQueue();
