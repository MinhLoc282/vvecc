import { useState, useEffect } from "react";
import { TextField, Button, InputAdornment, IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import useTheme from "../../hooks/useTheme";
import Loading from "../../components/Loading/Loading";
import { toast } from "react-toastify";
import { authService } from "../../services/authService";

export default function Register() {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
  });

  const handleTogglePassword = () => setShowPassword(!showPassword);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data.email, data.password);
      
      console.log("Registration successful:", response);
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.error || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

  const passwordValue = watch("password", "");

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
          <h1 className="text-3xl sm:text-4xl font-extrabold">Register</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create your new account
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

          <TextField
            fullWidth
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === passwordValue || "Passwords do not match",
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting || isLoading}
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
            {isLoading || isSubmitting ? "Creating Account..." : "Sign Up"}
          </Button>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </form>
      {isLoading && <Loading />}
    </div>
  );
}
