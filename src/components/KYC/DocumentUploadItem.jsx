import React from "react";
import { Button, IconButton } from "@mui/material";
import { CloudUpload, Close } from "@mui/icons-material";

const DocumentUploadItem = ({ 
  title, 
  description, 
  imageUrl, 
  onImageUpload, 
  isDarkMode 
}) => {
  const handleRemoveImage = () => {
    // Create a fake event to clear the image
    const fakeEvent = {
      target: {
        files: []
      }
    };
    onImageUpload(fakeEvent);
  };

  return (
    <div className={`rounded-lg p-4 border border-dashed transition-colors h-40 flex flex-col ${isDarkMode ? 'bg-[#2a3441] border-gray-500 hover:border-blue-400' : 'bg-white border-gray-300 hover:border-blue-400'}`}>
      {/* Empty state - before image upload */}
      {!imageUrl && (
        <>
          <div className="text-center flex-1 flex flex-col justify-center items-center">
            <div className={`rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
              <CloudUpload sx={{ fontSize: 18, color: "#3b82f6" }} />
            </div>
            <h4 className={`font-medium text-sm mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {title}
            </h4>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {description}
            </p>
          </div>
          
          {/* Upload button */}
          <div className="mt-2">
            <Button
              variant="contained"
              component="label"
              fullWidth
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                textTransform: "none",
                fontWeight: "600",
                borderRadius: "8px",
                paddingY: 0.75,
                fontSize: "0.75rem",
                height: "32px",
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                }
              }}
            >
              Upload Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={onImageUpload}
              />
            </Button>
          </div>
        </>
      )}
      
      {/* Filled state - after image upload */}
      {imageUrl && (
        <div className="relative h-full flex flex-col">
          {/* Delete button */}
          <IconButton
            onClick={handleRemoveImage}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              zIndex: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              width: 24,
              height: 24,
              '&:hover': {
                backgroundColor: 'rgba(220, 38, 38, 0.8)',
              }
            }}
          >
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
          
          {/* Image preview */}
          <div className="w-full flex-1 rounded-lg overflow-hidden mb-2">
            <img
              src={imageUrl}
              alt={`${title} preview`}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Status indicator */}
          <div className="text-center">
            <p className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              ✓ {title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadItem;
