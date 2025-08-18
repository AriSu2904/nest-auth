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
