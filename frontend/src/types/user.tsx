export interface User {
    user_id: number;
    email: string;
    phone_number: string;
    role: string;
    shop_name: string | null;
    subscription: string | null;
    category: string;
    address: string;
    gstin: string | null;
    image: string | null;
    licence_name: string;
  }
  
  export interface UpdateUserDto {
    phone_number: string;
    shop_name: string;
    category: string;
    address: string;
    gstin: string;
    licence_name: string;
    image?: string;
  }