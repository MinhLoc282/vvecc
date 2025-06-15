import React from "react";
import { CloudUpload } from "@mui/icons-material";
import DocumentUploadItem from "./DocumentUploadItem";

const DocumentUploadSection = ({ isDarkMode, formValues, handleImageUpload }) => {
  return (
    <div className={`rounded-xl p-6 shadow-sm border ${isDarkMode ? 'bg-[#1e2532] border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center mb-6">
        <div className={`rounded-lg p-2 mr-3 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
          <CloudUpload sx={{ color: 'white', fontSize: 24 }} />
        </div>
        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Document Upload
        </h3>
      </div>
      
      <div className="space-y-4">
        <DocumentUploadItem
          isDarkMode={isDarkMode}
          title="Portrait Photo"
          description="Clear photo of your face"
          imageUrl={formValues.portraitImageUrl}
          altText="Portrait preview"
          onImageUpload={handleImageUpload('portrait')}
        />

        <DocumentUploadItem
          isDarkMode={isDarkMode}
          title="ID Front Side"
          description="Front of your ID"
          imageUrl={formValues.frontIdImageUrl}
          altText="Front ID preview"
          onImageUpload={handleImageUpload('frontId')}
        />

        <DocumentUploadItem
          isDarkMode={isDarkMode}
          title="ID Back Side"
          description="Back of your ID"
          imageUrl={formValues.backIdImageUrl}
          altText="Back ID preview"
          onImageUpload={handleImageUpload('backId')}
        />
      </div>
    </div>
  );
};

export default DocumentUploadSection;
