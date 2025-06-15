import React, { useState } from "react";
import YouTube from "react-youtube";
import { Button } from "@mui/material";
import Loading from "../Loading/Loading";

const KYCVideoContent = ({ onComplete, loading = false }) => {
  const [hasEnded, setHasEnded] = useState(false);

  const opts = {
    width: "100%",
    height: "320",
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      cc_load_policy: 0,
      start: 0,
      enablejsapi: 1,
      origin: window.location.origin,
    },
  };

  const onStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      setHasEnded(true);
    }
  };

  return (
    <div className="text-center">
      <div className="relative rounded-2xl overflow-hidden shadow-lg mb-4">
        <YouTube
          videoId="B8F-d_1ZVWs"
          opts={opts}
          onStateChange={onStateChange}
          className="rounded-2xl"
        />
      </div>
      <Button
        variant="contained"
        size="large"
        disabled={!hasEnded || loading}
        sx={{
          background: hasEnded && !loading
            ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
            : "#94a3b8",
          borderRadius: "12px",
          padding: "12px 32px",
          fontSize: "1rem",
          fontWeight: 600,
          textTransform: "none",
          boxShadow: hasEnded && !loading
            ? "0 4px 16px rgba(59, 130, 246, 0.2)"
            : "none",
          "&:hover": hasEnded && !loading
            ? {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 24px rgba(59, 130, 246, 0.3)",
              }
            : {},
        }}
        onClick={onComplete}
      >
        {loading ? (
          <Loading size={24} />
        ) : hasEnded ? (
          "Complete KYC"
        ) : (
          "Watch full video to continue"
        )}
      </Button>
    </div>
  );
};

export default KYCVideoContent;
