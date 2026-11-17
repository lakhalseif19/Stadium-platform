import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';

@Processor('notifications')
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.warn(`Push delivery is unavailable for queued notification job ${job.id}`);
    return { pushStatus: 'unavailable' };
  }
}
