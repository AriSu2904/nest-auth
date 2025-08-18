import { createParamDecorator } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data, req) => {
  const request = req.switchToHttp().getRequest();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return request.user;
});
