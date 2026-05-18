import React from 'react';
import { Tooltip } from '@mui/material';
import styles from './IconButton.module.scss';

const IconButton = ({
  icon: Icon,
  onClick,
  color = 'secondary',
  tooltip,
  disabled = false,
  size = 18,
  className = '',
}) => {
  const colorMap = {
    primary: 'var(--primary-main)',
    secondary: 'var(--secondary-color)',
    info: 'var(--info-main)',
    success: 'var(--success-main)',
    warning: 'var(--warning-main)',
    error: 'var(--error-main)',
  };

  const bgColorMap = {
    primary: 'rgba(115, 103, 240, 0.16)',
    secondary: 'rgba(125, 127, 133, 0.1)',
    info: 'rgba(0, 207, 232, 0.16)',
    success: 'rgba(40, 199, 111, 0.16)',
    warning: 'rgba(245, 124, 0, 0.16)',
    error: 'rgba(211, 47, 47, 0.16)',
  };

  const button = (
    <button
      className={`${styles.iconButton} ${className}`}
      style={{
        '--icon-color': colorMap[color],
        '--hover-bg': bgColorMap[color],
        '--icon-size': `${size}px`,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={size} />
    </button>
  );

  if (tooltip) {
    return <Tooltip title={tooltip} arrow>{button}</Tooltip>;
  }

  return button;
};

export default IconButton;
