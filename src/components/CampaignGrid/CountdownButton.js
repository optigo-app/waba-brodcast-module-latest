import React, { useState, useEffect, useCallback } from 'react';
import { Octagon } from 'lucide-react';
import IconButton from '../Common/IconButton/IconButton';
import styles from './CampaignGrid.module.scss';

/**
 * Self-contained countdown button that manages its own timer.
 * Does NOT cause parent re-renders - only re-renders itself.
 */
const CountdownButton = ({ expiry, onStop, row }) => {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((expiry - Date.now()) / 1000)));

  useEffect(() => {
    // Update immediately then every second
    const tick = () => {
      const msLeft = expiry - Date.now();
      if (msLeft <= 0) {
        // Natural expiry: do NOT call onStop here.
        // The global interval in CampaignGrid detects expiry and calls triggerSendBulk.
        // Calling onStop would remove the timer from state before the global interval runs,
        // preventing the API from ever firing.
        return false;
      }
      setRemaining(Math.ceil(msLeft / 1000));
      return true;
    };

    if (!tick()) return;

    const interval = setInterval(() => {
      if (!tick()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiry, onStop, row]);

  const handleClick = useCallback(() => {
    onStop(row);
  }, [onStop, row]);

  // Don't render if timer already expired
  if (remaining <= 0) return null;

  return (
    <IconButton
      icon={Octagon}
      color="error"
      className={styles.stopButtonPulse}
      tooltip={`Stop (${remaining}s)`}
      onClick={handleClick}
    />
  );
};

export default React.memo(CountdownButton);
