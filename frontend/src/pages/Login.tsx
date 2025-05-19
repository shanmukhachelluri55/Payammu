import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { loginUser } from '../services/service';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { TextField, Button, IconButton, Typography, Box } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface LoginProps {
  onForgotClick: () => void;
  onLoginSuccess: (userID: string, address: string, email: string, shopName: string) => void;
}

export default function Login({ onForgotClick, onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const loginToast = toast.loading('Logging in...', {
      duration: 3000,
    });

    try {
      const { userId, address, shopName } = await loginUser(email, password);
      localStorage.setItem('userID', JSON.stringify(userId));
      onLoginSuccess(userId, address, email, shopName);
      toast.success('Login successful 🎉', { id: loginToast });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid credentials');
      toast.error('Login failed ❌', { id: loginToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('doll.jpg')",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="w-full max-w-4xl flex shadow-lg rounded-2xl overflow-hidden"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left Section (Image + Text) */}
        <motion.div
          className="w-1/2 bg-cover bg-center relative flex flex-col justify-center items-center p-0"
          style={{
            backgroundImage: "url('https://example.com/your-background-image.jpg')",
          }}
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-purple-900 opacity-75"></div>
          <div className="relative text-white text-center">
            <Typography variant="h4" fontWeight="bold" color="white">
              "Efficiency at Your Fingertips"
            </Typography>
            <Typography variant="body1" className="mt-3" color="white">
              POS billing made simple, fast, and accurate.
            </Typography>
          </div>
        </motion.div>

        {/* Right Section (Form) */}
        <motion.div
          className="w-1/2 bg-white/50 backdrop-blur-lg p-10 flex flex-col justify-center rounded-tr-3xl rounded-br-3xl"
          initial={{ x: 100 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography variant="h4" fontWeight="bold" className="text-gray-900 text-center pb-6">
            Welcome
          </Typography>

          {error && (
            <Box sx={{ marginBottom: 2 }}>
              <Typography variant="body2" color="error" align="center">
                {error}
              </Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: <Mail className="mr-2" />,
                }}
                sx={{ marginBottom: 2 }}
              />
            </div>
            <div>
              <TextField
                label="Password"
                variant="outlined"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: <Lock className="mr-2" />,
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
                sx={{ marginBottom: 2 }}
              />
            </div>

            <div className="text-right">
              <Button
                onClick={onForgotClick}
                className="text-sm text-purple-600 hover:underline"
                disabled={loading}
              >
                Forgot Your Password?
              </Button>
            </div>

            <Button
  type="submit"
  variant="contained"
  color="primary"
  fullWidth
  sx={{
    marginTop: 3,
    padding: '12px 24px', // Increased padding for a more prominent button
    borderRadius: '12px', // Rounded corners for a more modern look
    fontWeight: 'bold', // Bold text for emphasis
    textTransform: 'none', // Avoid uppercase transformation for a more subtle style
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow effect
    backgroundColor: '#7e57c2', // Custom background color
    '&:hover': {
      backgroundColor: '#5e35b1', // Darker shade when hovered
      boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.15)', // Stronger shadow on hover
    },
    '&:active': {
      backgroundColor: '#512da8', // Darker shade when active
    },
    '&:disabled': {
      backgroundColor: '#b39ddb', // Lighter background for disabled state
      color: '#fff',
      boxShadow: 'none', // No shadow when disabled
    },
  }}
  disabled={loading}
>
  {loading ? 'Logging In...' : 'Sign In'}
</Button>

          </form>
        </motion.div>
      </motion.div>

      <Toaster position="top-right" reverseOrder={false} />
    </motion.div>
  );
}
