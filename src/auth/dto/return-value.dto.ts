import { CreateUserDtoResponse } from './create-user.dto';

export interface SessionDto {
  persona: string;
  deviceId: string;
  hashRefreshToken: string;
  hashDeviceId: string;
  nonce: string;
}

export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  hashRefreshToken: string;
}

export interface TokenPayloadDto {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenDto {
  accessToken: string;
}

export interface UserProfileDto {
  persona: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  isVerified: boolean;
}

export interface FullUserProfileDto extends UserProfileDto {
  id: string;
  password: string;
}

export interface UserLocalSignatureDto {
  sub: string;
  email: string;
  additionalData: {
    firstName?: string;
    lastName?: string;
  };
}

export interface UserGoogleProfileDto {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
}

export interface VerifyEmailDto extends CreateUserDtoResponse {
  expiresAt: number;
  reVerifyAfterSeconds: number;
}

export interface CacheTokenPayload {
  token: string;
  persona: string;
  email: string;
  createdAt: string;
  expiredAt: string;
}
