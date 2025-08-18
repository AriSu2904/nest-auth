import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';

export class DeviceIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const deviceId = request.headers['x-device-id'];

    if (!deviceId) {
      throw new BadRequestException('X-Device-ID is required');
    }

    return true;
  }
}
