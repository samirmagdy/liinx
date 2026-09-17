import { JobScheduler, ScheduledJob } from './interfaces.js';
import { log, logError } from '../logger.js';

export class InProcessJobScheduler implements JobScheduler {
  readonly name = 'in-process-timer';
  private jobs: ScheduledJob[] = [];
  private timers: NodeJS.Timeout[] = [];
  private isRunning = false;

  register(job: ScheduledJob): void {
    this.jobs.push(job);
    if (this.isRunning) {
      this.startJob(job);
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    for (const job of this.jobs) {
      this.startJob(job);
    }
    log('info', 'In-process job scheduler started', { jobCount: this.jobs.length });
  }

  stop(): void {
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    this.timers = [];
    this.isRunning = false;
    log('info', 'In-process job scheduler stopped');
  }

  private startJob(job: ScheduledJob): void {
    let jobBusy = false;
    const timer = setInterval(async () => {
      if (jobBusy) return;
      jobBusy = true;
      try {
        await job.run();
      } catch (err) {
        logError(`Scheduled job '${job.name}' failed`, err);
      } finally {
        jobBusy = false;
      }
    }, job.intervalMs);
    timer.unref();
    this.timers.push(timer);
  }
}

export const inProcessJobScheduler = new InProcessJobScheduler();
