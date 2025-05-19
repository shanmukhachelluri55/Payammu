import { BASE_URL } from './service';

export interface License {
  user_id: number;
  email: string;
  licence_name: string;
  subscription: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'pending';
  usage_percentage: number;
}

export async function fetchLicenses(): Promise<License[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/user-details`);
    const data = await response.json();
    if (data.success) {
      return data.data.map((license: any) => ({
        ...license,
        status: determineStatus(license.end_date),
        usage_percentage: license.usage_percentage || 0
      }));
    } else {
      throw new Error('Failed to fetch licenses');
    }
  } catch (error) {
    console.error('Error fetching licenses:', error);
    throw error;
  }
}

function determineStatus(endDate: string): 'active' | 'expired' | 'pending' {
  const now = new Date();
  const end = new Date(endDate);
  
  if (end < now) return 'expired';
  
  // If the license expires within 30 days, mark it as pending
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  if (end <= thirtyDaysFromNow) return 'pending';
  return 'active';
}

interface RenewalResponse {
  message: string;
  newEndDate: string;
}

export async function renewLicense(userId: number, duration: string): Promise<RenewalResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/subscriptions/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        duration: duration
      }),
    });

    const data = await response.json();
    
    // If we have a message and newEndDate, consider it a success
    if (data.message && data.newEndDate) {
      return data;
    } else {
      throw new Error(data.message || 'Failed to renew the license');
    }
  } catch (error) {
    console.error('Error renewing license:', error);
    throw error;
  }
}