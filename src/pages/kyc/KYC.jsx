import React, { useState, useEffect } from "react";
import styles from "./kyc.module.css";
import { Button } from "@mui/material";
import useTheme from "../../hooks/useTheme";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { authService } from "../../services/authService";
import KYCOptionButton from "../../components/KYC/KYCOptionButton";
import KYCVideoContent from "../../components/KYC/KYCVideoContent";
import KYCFormContent from "../../components/KYC/KYCFormContent";

// KYC page with two options: Watch Video or Enter Info & Upload Image
const KYC = () => {
  const { theme } = useTheme({});
  const isDarkMode = theme === "dark";
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null); // 'video' or 'form'
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit: handleFormSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      birthDate: "",
      idType: "",
      idNumber: "",
      portraitImageUrl: "",
      frontIdImageUrl: "",
      backIdImageUrl: "",
    },
  });

  // Register image fields with validation
  React.useEffect(() => {
    register("portraitImageUrl", { required: "Portrait photo is required" });
    register("frontIdImageUrl", { required: "Front ID photo is required" });
    register("backIdImageUrl", { required: "Back ID photo is required" });
  }, [register]);

  // Watch all form values for real-time validation
  const formValues = watch();

  // Handle image upload with React Hook Form
  const handleImageUpload = (imageType) => (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setValue(`${imageType}ImageUrl`, imageUrl, { shouldValidate: true });
    } else {
      // Remove image when no file (for delete functionality)
      setValue(`${imageType}ImageUrl`, "", { shouldValidate: true });
    }
  };

  // Handle option selection
  const handleSelect = (option) => {
    setSelected(option);
    setShowPopup(true);
  };

  // Handle closing popup
  const handleClosePopup = () => {
    setShowPopup(false);
    setSelected(null);
    reset(); // Reset form when closing popup
  };

  // Handle form submit with React Hook Form
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      // Gọi API để complete KYC với method 2 (form)
      await authService.completeKYC("2");
      
      handleClosePopup();
      handleNavigateToDashboard();
    } catch (error) {
      console.error("KYC completion error:", error);
      toast.error(error.error || "KYC completion failed. Please try again.");
      setLoading(false);
    }
  };

  // Handle video completion
  const handleVideoComplete = async () => {
    try {
      setLoading(true);
      // Gọi API để complete KYC với method 1 (video)
      await authService.completeKYC("1");
      
      handleClosePopup();
      handleNavigateToDashboard();
    } catch (error) {
      console.error("KYC completion error:", error);
      toast.error(error.error || "KYC completion failed. Please try again.");
      setLoading(false);
    }
  };

  // Handle navigation to dashboard if KYC is already completed
  const handleNavigateToDashboard = () => {
    // toast success message
    toast.success("KYC completed successfully!");
    
    // Navigate to dashboard
    navigate("/dashboard");
  };

  // Check authentication and KYC status on page load
  useEffect(() => {
    const checkAuthAndKYC = async () => {
      // Kiểm tra xem user đã login chưa
      if (!authService.isAuthenticated()) {
        toast.error("Please login first");
        navigate("/login");
        return;
      }

      // Kiểm tra xem user đã KYC chưa
      const user = authService.getCurrentUser();
      if (user && user.kyc) {
        toast.info("KYC already completed");
        navigate("/dashboard");
        return;
      }

      // Nếu chưa KYC thì hiển thị trang KYC
      setLoading(false);
    };

    checkAuthAndKYC();
  }, [navigate]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
        isDarkMode ? "bg-[#0d0f15]" : "bg-[#f9fbfe]"
      }`}
    >
      <div
        className={`w-full max-w-4xl rounded-2xl p-8 sm:p-12 shadow-xl transition-colors duration-300 ${
          isDarkMode ? "bg-[#1a1f2e] text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold">
            KYC Verification
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Verify your account to unlock all VECC features
          </p>
        </div>
        {/* Option buttons */}
        <div className={styles.optionButtons}>
          <KYCOptionButton
            type="video"
            selected={selected}
            onSelect={handleSelect}
            isDarkMode={isDarkMode}
          />
          <KYCOptionButton
            type="form"
            selected={selected}
            onSelect={handleSelect}
            isDarkMode={isDarkMode}
          />
        </div>
        {/* Popup with content */}
        {showPopup && (
          <div className={styles.popupOverlay}>
            <div
              className={`${styles.popup} ${
                isDarkMode
                  ? "bg-[#1a1f2e] text-white"
                  : "bg-white text-gray-900"
              }`}
              style={{
                maxWidth: "1000px",
                width: "95vw",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className={styles.popupTitle}>
                  {selected === "video"
                    ? "Watch KYC Video"
                    : "Manual KYC Verification"}
                </div>
                <Button
                  onClick={handleClosePopup}
                  sx={{
                    minWidth: "36px",
                    width: "36px",
                    height: "36px",
                    padding: "0",
                    borderRadius: "8px",
                    color: isDarkMode ? "#e2e8f0" : "#374151",
                    fontSize: "18px",
                    fontWeight: "bold",
                    backgroundColor: isDarkMode
                      ? "rgba(107, 114, 128, 0.1)"
                      : "rgba(156, 163, 175, 0.1)",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(107, 114, 128, 0.2)"
                        : "rgba(156, 163, 175, 0.2)",
                    },
                  }}
                >
                  ✕
                </Button>
              </div>

              {/* Video content in popup */}
              {selected === "video" && (
                <KYCVideoContent
                  isDarkMode={isDarkMode}
                  loading={loading}
                  onComplete={handleVideoComplete}
                />
              )}

              {/* Form content in popup */}
              {selected === "form" && (
                <KYCFormContent
                  isDarkMode={isDarkMode}
                  register={register}
                  control={control}
                  formValues={formValues}
                  errors={errors}
                  handleImageUpload={handleImageUpload}
                  handleSubmit={handleFormSubmit(onSubmit)}
                  handleClosePopup={handleClosePopup}
                  loading={loading}
                  isFormValid={isValid}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYC;
