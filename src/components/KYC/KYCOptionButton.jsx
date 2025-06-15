import { PlayCircleOutline, AssignmentInd } from "@mui/icons-material";
import styles from "../../pages/kyc/kyc.module.css";

const KYCOptionButton = ({ type, selected, onSelect, isDarkMode }) => {
  const isVideo = type === "video";
  
  return (
    <div
      className={`${styles.optionButton} ${selected === type ? styles.selected : ""} ${isDarkMode ? styles.optionButtonDark : ""}`}
      onClick={() => onSelect(type)}
    >
      {isVideo ? (
        <PlayCircleOutline className={styles.optionIcon} />
      ) : (
        <AssignmentInd className={styles.optionIcon} />
      )}
      <div className={styles.optionTitle}>
        {isVideo ? "Watch KYC Video" : "Enter Info & Upload Image"}
      </div>
      <div className={styles.optionDesc}>
        {isVideo 
          ? "Watch a short video to complete your KYC verification quickly."
          : "Fill in your personal details and upload your ID photo for manual verification."
        }
      </div>
    </div>
  );
};

export default KYCOptionButton;
