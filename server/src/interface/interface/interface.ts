export interface ICustomerMutation {
  registerCustomer: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    locationCord: number[];
    country: string;
  };
  loginCustomer: {
    email: string;
    password: string;
  };
}

export interface IAuthenticationMutation {
  verifyOtp: {
    otp: number;
  };
  resendOtp: {
    email: string;
  };
  forgetPassword: {
    email: string;
  };
  resetPassword: {
    token: string;
    password: string;
  };
}

export interface ICustomerQuery {}
