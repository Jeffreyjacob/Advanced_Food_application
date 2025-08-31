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
  BigVehicle = 'BigVechile',
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
  expired = 'expired',
}

export enum expiryDocumentTypeEnum {
  businessLicense = 'businessLicense',
  taxCeritificate = 'taxCeritificate',
  foodHandlerPermit = 'foodHandlerPermit',
  driverLicense = 'driverLicense',
  vehicleRegistration = 'vehicleRegistration',
}

export enum updateCartItemTypeEnum {
  updateQuantity = 'updateQuantity',
  removeCartItem = 'removeCartItem',
}

export enum OrderStatusEnum {
  awaiting_payment = 'awaiting_payment',
  pending_restaurant_acceptance = 'pending_restaurant_acceptance',
  preparing = 'preparing',
  ready_for_pickup = 'ready_for_pickup',
  driver_assigned = 'driver_assigned',
  picked_up = 'picked_up',
  delivering = 'delivering',
  delivered = 'delivered',
  cancelled = 'cancelled',
  refunded = 'refunded',
}

export enum StripePaymentStatus {
  pending = 'pending',
  succeeded = 'succeded',
  failed = 'failed',
  cancelled = 'cancelled',
  refunded = 'refunded',
}

export enum RequestStatusEnum {
  pending = 'pending',
  accepted = 'accepted',
  rejected = 'rejected',
  expired = 'expired',
}
