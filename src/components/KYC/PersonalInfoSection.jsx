import React from "react";
import { TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Controller } from "react-hook-form";
import { AssignmentInd } from "@mui/icons-material";

const PersonalInfoSection = ({ register, formValues, errors, isDarkMode, control }) => {
  return (
    <div className={`rounded-xl p-6 shadow-sm border ${isDarkMode ? 'bg-[#1e2532] border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center mb-6">
        <div className={`rounded-lg p-2 mr-3 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
          <AssignmentInd sx={{ color: 'white', fontSize: 24 }} />
        </div>
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Personal Information
        </h3>
      </div>
      
      <div className="space-y-4">
        <TextField
          fullWidth
          label="Full Name"
          variant="outlined"
          {...register("name", { 
            required: "Full name is required",
            minLength: { value: 2, message: "Name must be at least 2 characters" }
          })}
          error={!!errors.name}
          helperText={errors.name?.message}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: isDarkMode ? "#2a3441" : "#ffffff",
              color: isDarkMode ? "#fff" : "#000",
              "& fieldset": {
                borderColor: errors.name 
                  ? "#ef4444" 
                  : isDarkMode ? "#4b5563" : "#e5e7eb",
              },
              "&:hover fieldset": {
                borderColor: errors.name ? "#ef4444" : "#3b82f6",
              },
              "&.Mui-focused fieldset": {
                borderColor: errors.name ? "#ef4444" : "#3b82f6",
                borderWidth: "2px",
              },
            },
            "& .MuiInputLabel-root": {
              color: errors.name 
                ? "#ef4444" 
                : isDarkMode ? "#9ca3af" : "#6b7280",
              "&.Mui-focused": {
                color: errors.name ? "#ef4444" : "#3b82f6",
              },
            },
            "& .MuiFormHelperText-root": {
              color: "#ef4444",
            },
          }}
        />

        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          variant="outlined"
          {...register("birthDate", { 
            required: "Date of birth is required"
          })}
          error={!!errors.birthDate}
          helperText={errors.birthDate?.message}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: isDarkMode ? "#2a3441" : "#ffffff",
              color: isDarkMode ? "#fff" : "#000",
              "& fieldset": {
                borderColor: errors.birthDate 
                  ? "#ef4444" 
                  : isDarkMode ? "#4b5563" : "#e5e7eb",
              },
              "&:hover fieldset": {
                borderColor: errors.birthDate ? "#ef4444" : "#3b82f6",
              },
              "&.Mui-focused fieldset": {
                borderColor: errors.birthDate ? "#ef4444" : "#3b82f6",
                borderWidth: "2px",
              },
            },
            "& .MuiInputLabel-root": {
              color: errors.birthDate 
                ? "#ef4444" 
                : isDarkMode ? "#9ca3af" : "#6b7280",
              "&.Mui-focused": {
                color: errors.birthDate ? "#ef4444" : "#3b82f6",
              },
            },
            "& .MuiFormHelperText-root": {
              color: "#ef4444",
            },
          }}
        />

        <Controller
          name="idType"
          control={control}
          rules={{ required: "Please select an ID type" }}
          render={({ field }) => (
            <FormControl fullWidth required error={!!errors.idType}>
              <InputLabel 
                sx={{ 
                  color: errors.idType 
                    ? "#ef4444" 
                    : isDarkMode ? "#9ca3af" : "#6b7280",
                  "&.Mui-focused": {
                    color: errors.idType ? "#ef4444" : "#3b82f6",
                  },
                }}
              >
                ID Type
              </InputLabel>
              <Select
                {...field}
                label="ID Type"
                sx={{
                  borderRadius: "12px",
                  backgroundColor: isDarkMode ? "#2a3441" : "#ffffff",
                  color: isDarkMode ? "#fff" : "#000",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderRadius: "12px",
                    borderColor: errors.idType 
                      ? "#ef4444" 
                      : isDarkMode ? "#4b5563" : "#e5e7eb",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: errors.idType ? "#ef4444" : "#3b82f6",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: errors.idType ? "#ef4444" : "#3b82f6",
                    borderWidth: "2px",
                  },
                }}
              >
                <MenuItem value="passport">Passport</MenuItem>
                <MenuItem value="national_id">National ID Card</MenuItem>
                <MenuItem value="driver_license">Driver's License</MenuItem>
                <MenuItem value="citizen_id">Citizen ID Card</MenuItem>
              </Select>
              {errors.idType && (
                <p className="text-red-500 text-xs mt-1 ml-3">{errors.idType.message}</p>
              )}
            </FormControl>
          )}
        />

        <TextField
          fullWidth
          label="ID Number"
          variant="outlined"
          {...register("idNumber", { 
            required: "ID number is required",
            minLength: { value: 5, message: "ID number must be at least 5 characters" }
          })}
          error={!!errors.idNumber}
          helperText={errors.idNumber?.message}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: isDarkMode ? "#2a3441" : "#ffffff",
              color: isDarkMode ? "#fff" : "#000",
              "& fieldset": {
                borderColor: errors.idNumber 
                  ? "#ef4444" 
                  : isDarkMode ? "#4b5563" : "#e5e7eb",
              },
              "&:hover fieldset": {
                borderColor: errors.idNumber ? "#ef4444" : "#3b82f6",
              },
              "&.Mui-focused fieldset": {
                borderColor: errors.idNumber ? "#ef4444" : "#3b82f6",
                borderWidth: "2px",
              },
            },
            "& .MuiInputLabel-root": {
              color: errors.idNumber 
                ? "#ef4444" 
                : isDarkMode ? "#9ca3af" : "#6b7280",
              "&.Mui-focused": {
                color: errors.idNumber ? "#ef4444" : "#3b82f6",
              },
            },
            "& .MuiFormHelperText-root": {
              color: "#ef4444",
            },
          }}
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;
