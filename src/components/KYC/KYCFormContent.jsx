import { Button } from "@mui/material";
import Loading from "../Loading/Loading";
import PersonalInfoSection from "./PersonalInfoSection";
import DocumentUploadSection from "./DocumentUploadSection";
 
const KYCFormContent = ({ 
  isDarkMode, 
  register,
  control,
  formValues,
  errors,
  handleImageUpload, 
  handleSubmit, 
  handleClosePopup, 
  loading,
  isFormValid 
}) => {
  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Personal Information */}
          <PersonalInfoSection 
            isDarkMode={isDarkMode}
            register={register}
            control={control}
            formValues={formValues}
            errors={errors}
          />

          {/* Right Column - Document Upload */}
          <DocumentUploadSection 
            isDarkMode={isDarkMode}
            formValues={formValues}
            handleImageUpload={handleImageUpload}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="outlined"
            onClick={handleClosePopup}
            sx={{
              textTransform: "none",
              fontWeight: "600",
              borderRadius: "12px",
              borderColor: isDarkMode ? "#6b7280" : "#d1d5db",
              color: isDarkMode ? "#e5e7eb" : "#374151",
              paddingY: 1.2,
              paddingX: 3,
              borderWidth: "2px",
              minWidth: "100px",
              '&:hover': {
                borderColor: isDarkMode ? '#9ca3af' : '#9ca3af',
                backgroundColor: isDarkMode ? 'rgba(107, 114, 128, 0.1)' : 'rgba(156, 163, 175, 0.1)',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !isFormValid}
            sx={{
              background: isFormValid 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                : 'linear-gradient(135deg, #94a3b8, #64748b)',
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              paddingY: 1.2,
              paddingX: 4,
              borderRadius: "12px",
              minWidth: "180px",
              boxShadow: isFormValid 
                ? '0 4px 16px rgba(59, 130, 246, 0.3)' 
                : '0 2px 8px rgba(148, 163, 184, 0.2)',
              "&:hover": isFormValid ? { 
                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
              } : {},
              "&:disabled": { 
                backgroundColor: "#94a3b8",
                background: 'linear-gradient(135deg, #94a3b8, #64748b)',
                transform: 'none',
                boxShadow: '0 2px 8px rgba(148, 163, 184, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'not-allowed',
              },
            }}
          >
            {loading ? <Loading size={24} /> : "Submit KYC"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default KYCFormContent;
