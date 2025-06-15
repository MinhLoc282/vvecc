import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import useTheme from "../../hooks/useTheme";
import Loading from "../../components/Loading/Loading";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

import { FaGoogle, FaFacebookF } from "react-icons/fa";

export default function Login() {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const onSubmit = async ({ email, password }) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      toast.success("Login successful!");
      
      // Kiểm tra KYC status và redirect accordingly
      if (response.user.kyc) {
        navigate("/dashboard");
      } else {
        navigate("/kyc");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // handle login with Google (tạm thời disabled)
  const handleLoginWithGoogle = () => {
    toast.info("Google login will be available soon!");
  };

  // handle login with Facebook (tạm thời disabled)
  const handleLoginWithFacebook = () => {
    toast.info("Facebook login will be available soon!");
  };

  // Check if user is already authenticated on component mount
  useEffect(() => {
    // Chỉ kiểm tra khi component mount lần đầu
    if (authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      if (user && user.kyc) {
        navigate("/dashboard");
      } else if (user && !user.kyc) {
        navigate("/kyc");
      }
    }
  }, []); // Empty dependency array để chỉ chạy một lần

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
        isDarkMode ? "bg-[#0d0f15]" : "bg-[#f9fbfe]"
      }`}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`w-full sm:max-w-md md:max-w-lg rounded-2xl p-8 sm:p-10 shadow-xl transition-colors duration-300 ${
          isDarkMode ? "bg-[#1a1f2e] text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Log In</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Access your VECC dashboard
          </p>
        </div>

        <div className="space-y-6">
          <TextField
            fullWidth
            label="Email address"
            variant="outlined"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                message: "Enter a valid email",
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: isDarkMode ? "#2c3244" : "#fff",
                color: isDarkMode ? "#fff" : "#000",
              },
              "& .MuiInputLabel-root": {
                color: isDarkMode ? "#bbb" : undefined,
              },
            }}
            InputLabelProps={{
              style: { color: isDarkMode ? "#bbb" : undefined },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Minimum 8 characters" },
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: isDarkMode ? "#2c3244" : "#fff",
                color: isDarkMode ? "#fff" : "#000",
              },
              "& .MuiInputLabel-root": {
                color: isDarkMode ? "#bbb" : undefined,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePassword}
                    edge="end"
                    sx={{ color: isDarkMode ? "#bbb" : undefined }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            InputLabelProps={{
              style: { color: isDarkMode ? "#bbb" : undefined },
            }}
          />

          <div className="text-right text-sm">
            <Link
              to="/forgot-password"
              className="text-blue-500 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting || loading}
            sx={{
              backgroundColor: isDarkMode ? "#ffffff" : "rgba(4, 18, 53, 1)",
              color: isDarkMode ? "rgba(4, 18, 53, 1)" : "#ffffff",
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              paddingY: 1.5,
              borderRadius: "16px",
              "&:hover": { 
                backgroundColor: isDarkMode ? "#f3f4f6" : "rgba(4, 18, 53, 0.9)",
                color: isDarkMode ? "rgba(4, 18, 53, 1)" : "#ffffff",
              },
              "&:disabled": {
                backgroundColor: isDarkMode ? "#e5e7eb" : "rgba(4, 18, 53, 0.5)",
                color: isDarkMode ? "#9ca3af" : "rgba(255, 255, 255, 0.7)",
              },
            }}
          >
            {loading || isSubmitting ? "Logging in..." : "Log In"}
          </Button>

          <div className="flex items-center justify-center gap-4 py-2">
            <Divider
              sx={{ flexGrow: 1, borderColor: isDarkMode ? "#333" : "#ccc" }}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
            <Divider
              sx={{ flexGrow: 1, borderColor: isDarkMode ? "#333" : "#ccc" }}
            />
          </div>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleLoginWithGoogle}
            startIcon={
              <FaGoogle style={{ color: "#DB4437", fontSize: "20px" }} />
            }
            sx={{
              textTransform: "none",
              fontWeight: "500",
              borderRadius: "12px",
              borderColor: "#DB4437",
              color: isDarkMode ? "#fff" : "#DB4437",
              "&:hover": {
                backgroundColor: "#DB443710",
                borderColor: "#c23321",
              },
            }}
          >
            Continue with Google
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleLoginWithFacebook}
            startIcon={
              <FaFacebookF style={{ color: "#1877F2", fontSize: "20px" }} />
            }
            sx={{
              textTransform: "none",
              fontWeight: "500",
              borderRadius: "12px",
              borderColor: "#1877F2",
              color: isDarkMode ? "#fff" : "#1877F2",
              "&:hover": {
                backgroundColor: "#1877F210",
                borderColor: "#145dbf",
              },
            }}
          >
            Continue with Facebook
          </Button>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-500 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </form>
      {loading && <Loading />}
    </div>
  );
}
