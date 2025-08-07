export enum EmailJobType {
  VERIFICATION = 'verificaton',
  PASSWORD_RESET = 'password-reset',
  NOTIFICATION = 'notification',
  MARKETING = 'marketing',
}

export enum EmailPriority {
  URGENT = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
}

export enum RoleEnums {
  Customer = 'Customer',
  Restaurant_Owner = 'Restaurant_owner',
  Driver = 'Driver',
  Admin = 'Admin',
}

export enum RestaurantVerificationStatusEnum {
  Pending = 'Pending',
  Under_Review = 'Under_Review',
  Rejected = 'Rejected',
  Approved = 'Approved',
}

export enum DocumentStatusEnum {
  Pending = 'Pending',
  Rejected = 'Rejected',
  Approved = 'Approved',
  Expired = 'Expired',
  Verified = 'verified',
}

export enum VehicleTypeEnum {
  Bike = 'Bike',
  Car = 'Car',
  Scooter = 'Scooter',
  Bicycle = 'Bicycle',
}

export enum StripeAccountType {
  express = 'express',
  standard = 'standard',
  custom = 'custom',
}

export enum StripeAccountStatusEnum {
  pending = 'pending',
  restricted = 'restricted',
  enabled = 'enabled',
  disabled = 'disabled',
}

export enum RestaurantDocumentTypeEnum {
  businessLicense = 'businessLicense',
  taxCeritificate = 'taxCeritificate',
  foodHandlerPermit = 'foodHandlerPermit',
}

export enum IdentityVerificationStatusEnum {
  not_started = 'not_started',
  pending = 'pending',
  verified = 'verified',
  requires_input = 'requires_input',
  cancelled = 'cancelled',
}

export enum expiryDocumentTypeEnum {
  businessLicense = 'businessLicense',
  taxCeritificate = 'taxCeritificate',
  foodHandlerPermit = 'foodHandlerPermit',
  driverLicense = 'driverLicense',
  vehicleRegistration = 'vehicleRegistration',
}
