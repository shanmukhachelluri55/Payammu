const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  const createEmailTemplate = (otp) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px;">
          <p style="margin-bottom: 20px;">Your verification code is:</p>
          <h1 style="text-align: center; color: #4a90e2; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
          <p style="margin-top: 20px;">This code will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `;
  };
  
  module.exports = {
    generateOTP,
    createEmailTemplate
  };