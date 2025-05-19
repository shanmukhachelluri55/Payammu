export interface User {
    userId: string;
    email: string;
    shopName: string;
    address: string;
    gstin?: string;
  }
  
  export interface OTPResponse {
    success: boolean;
    message: string;
    otpId?: string;
  }
  
  export interface VerifyOTPResponse {
    success: boolean;
    message: string;
    user?: User;
  }