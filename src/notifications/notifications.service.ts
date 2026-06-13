import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user/entities/user.entity';
import { UserService } from 'src/auth/user/user.service';
import { Repository } from 'typeorm';
import * as webPush from 'web-push';
import { NotificationEntity } from './entities/notifications.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly vapidEmail = 'mailto:sergio.gb99@hotmail.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {
    const vapidPublicKey = this.configService.get('vapidPublicKey');
    const vapidPrivateKey = this.configService.get('vapidPrivateKey');

    webPush.setVapidDetails(this.vapidEmail, vapidPublicKey, vapidPrivateKey);
  }

  async subscribe(
    user: User,
    subscription: PushSubscription,
  ): Promise<NotificationEntity> {
    try {
      if (!subscription?.endpoint) {
        throw new BadRequestException('Invalid subscription object');
      }

      const existingSubscription = await this.notificationRepository.findOne({
        where: {
          user: { id: user.id },
          endpoint: subscription.endpoint,
        },
      });

      if (existingSubscription) {
        return existingSubscription;
      }

      const newSubscription = this.notificationRepository.create({
        endpoint: subscription.endpoint,
        subscription,
        user,
      });

      const saved = await this.notificationRepository.save(newSubscription);

      return saved;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to subscribe to notifications',
      );
    }
  }

  async unsubscribe(user: User, subscription: PushSubscription): Promise<void> {
    try {
      if (!subscription?.endpoint) {
        throw new BadRequestException('Invalid subscription object');
      }

      const result = await this.notificationRepository.delete({
        user: { id: user.id },
        endpoint: subscription.endpoint,
      });

      if (result.affected === 0) {
        throw new NotFoundException('Subscription not found for this user');
      }

      this.logger.log(`User ${user.id} unsubscribed from push notifications`);
    } catch (error) {
      if (error instanceof (BadRequestException || NotFoundException)) {
        throw error;
      }
      this.logger.error(`Failed to unsubscribe user ${user.id}:`, error);
      throw new InternalServerErrorException(
        'Failed to unsubscribe from notifications',
      );
    }
  }

  async getUserSubscriptions(user: User): Promise<NotificationEntity[]> {
    try {
      return await this.notificationRepository.find({
        where: { user: { id: user.id } },
        order: { id: 'DESC' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch subscriptions for user ${user.id}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch subscriptions');
    }
  }

  private async sendNotification(
    subscription: PushSubscription,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      if (!subscription?.endpoint) {
        throw new BadRequestException('Invalid subscription object');
      }

      const webPushSubscription =
        this.convertSubscriptionForWebPush(subscription);
      await webPush.sendNotification(
        webPushSubscription,
        JSON.stringify(payload),
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof webPush.WebPushError) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          this.logger.warn(`Subscription is no longer valid: ${error.message}`);
          throw new NotFoundException('Subscription is no longer valid');
        }
      }

      this.logger.error('Push notification error:', error);
      throw new InternalServerErrorException('Failed to send notification');
    }
  }

  private convertSubscriptionForWebPush(subscription: any): any {
    if (subscription.keys?.p256dh && subscription.keys?.auth) {
      return subscription;
    }

    if (typeof subscription.getKey === 'function') {
      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')),
        },
      };
    }

    throw new BadRequestException(
      'Invalid subscription format: missing required keys',
    );
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) {
      throw new BadRequestException('Missing required subscription key');
    }
    return Buffer.from(buffer).toString('base64');
  }

  async sendNotificationToUser(
    userId: string,
    payload: Record<string, any>,
  ): Promise<PromiseSettledResult<void>[]> {
    try {
      const user = await this.userService.findUserById(userId);

      const subscriptions = await this.getUserSubscriptions(user);

      if (subscriptions.length === 0) {
        this.logger.warn(`No subscriptions found for user ${userId}`);
      }

      const results = await Promise.allSettled(
        subscriptions.map((notification) =>
          this.sendNotification(notification.subscription, payload),
        ),
      );

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          this.logger.error(
            `Failed to send notification to subscription ${subscriptions[index].id}: ${result.reason}`,
          );
        }
      });

      return results;
    } catch (error) {
      this.logger.error(
        `Failed to send notifications to user ${userId}:`,
        error,
      );
      throw new InternalServerErrorException('Failed to send notifications');
    }
  }
}
