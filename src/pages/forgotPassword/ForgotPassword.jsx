import { useState, useEffect } from "react";
import { TextField, Button } from "@mui/material";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import useTheme from "../../hooks/useTheme";
import Loading from "../../components/Loading/Loading";

export default function ForgotPassword() {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";
  const [loading, setLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate loading complete
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  const onSubmit = (data) => {
    console.log("Forgot password for:", data.email);
    // TODO: gọi API gửi link reset password
  };

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
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enter your email to receive reset instructions
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
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            disabled={isSubmitting}
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isSubmitting}
            sx={{
              backgroundColor: "#2563eb",
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              paddingY: 1.5,
              borderRadius: "16px",
              "&:hover": { backgroundColor: "#1e40af" },
            }}
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Remembered your password?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </form>

      {loading && <Loading />}
    </div>
  );
}
