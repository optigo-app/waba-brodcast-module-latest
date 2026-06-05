import React from 'react';
import { CircularProgress, Typography } from '@mui/material';
import styles from './ProcessOverlay.module.scss';

const clampProgress = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const ProcessOverlay = ({
  open = false,
  title = 'Processing',
  message = 'Please wait...',
  progress = null,
}) => {
  if (!open) return null;

  const safeProgress = clampProgress(progress);

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <CircularProgress size={30} thickness={4.4} />
        <Typography className={styles.title}>{title}</Typography>
        <Typography className={styles.message}>{message}</Typography>

        {safeProgress !== null && (
          <>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: `${safeProgress}%` }} />
            </div>
            <Typography className={styles.progressText}>{safeProgress}% completed</Typography>
          </>
        )}
      </div>
    </div>
  );
};

export default ProcessOverlay;
