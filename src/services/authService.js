import axios from 'axios';

// API server URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://vvecc-dev-server.glitch.me/api';

// Tạo axios instance với config mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý token hết hạn
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - chỉ clear localStorage, không redirect tự động
      localStorage.removeItem('authToken');
      localStorage.removeItem('email');
      localStorage.removeItem('kyc');
      // Không redirect tự động ở đây, để các component tự xử lý
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  // Health check
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // User registration
  async register(email, password) {
    try {
      const response = await apiClient.post('/register', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // User login
  async login(email, password) {
    try {
      const response = await apiClient.post('/login', {
        email,
        password,
      });
      
      // Lưu token và user info vào localStorage
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('email', user.email);
      localStorage.setItem('kyc', user.kyc ? 'true' : 'false');
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user KYC status
  async getKYCStatus() {
    try {
      const response = await apiClient.get('/user/kyc');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Complete KYC
  async completeKYC(method) {
    try {
      const response = await apiClient.post('/user/kyc/complete', {
        method: method.toString(), // "1" hoặc "2"
      });
      
      // Cập nhật token và KYC status
      const { token, user } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('kyc', user.kyc ? 'true' : 'false');
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user wallet info
  async getUserWallet() {
    try {
      const response = await apiClient.get('/user/wallet');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Connect wallet
  async connectWallet(walletAddress, signal = null) {
    try {
      const config = signal ? { signal } : {};
      const response = await apiClient.post('/user/wallet/connect', {
        walletAddress,
      }, config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Disconnect wallet
  async disconnectWallet() {
    try {
      const response = await apiClient.post('/user/wallet/disconnect');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Admin: Get all users
  async getAllUsers() {
    try {
      const response = await apiClient.get('/admin/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout (clear local storage)
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('email');
    localStorage.removeItem('kyc');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  // Get current user info from localStorage
  getCurrentUser() {
    const email = localStorage.getItem('email');
    const kyc = localStorage.getItem('kyc') === 'true';
    const token = localStorage.getItem('authToken');
    
    if (!email || !token) return null;
    
    return { email, kyc, token };
  },
};

export default authService;
