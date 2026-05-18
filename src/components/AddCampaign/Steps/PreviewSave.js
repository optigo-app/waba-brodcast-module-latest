import React, { useState } from 'react';
import { Typography, Button, Grid, Box, Paper } from '@mui/material';
import { Send, ChevronLeft, CheckCircle, AlertCircle, Megaphone, Clock, Filter, Users, MessageSquare } from 'lucide-react';
import styles from '../AddCampaign.module.scss';
import ConfirmationModal from '../../ConfirmationModal/ConfirmationModal';

const PreviewSave = ({ onBack, onSave, campaignName, campaignType, scheduledFor, audience, dataSource, repeat, recurrenceFrequency, messageConfigured, onNavigateToStep, isSaving }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSaveClick = () => {
    // Check validation before showing confirmation modal
    if (!campaignName) {
      onNavigateToStep?.(1, 'campaignName'); // Navigate to Campaign Details with error field
      return;
    }
    if (audience.length === 0) {
      onNavigateToStep?.(2, 'audience'); // Navigate to Audience with error field
      return;
    }
    if (!messageConfigured) {
      onNavigateToStep?.(3, 'message'); // Navigate to Message with error field
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    onSave();
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
  };
  const summaryCards = [
    {
      label: 'Campaign Name',
      value: campaignName || 'Set campaign name',
      icon: Megaphone,
      color: '#7367f0'
    },
    {
      label: 'Trigger Campaign',
      value: campaignType === 'immediate' ? 'Immediately' : scheduledFor ? scheduledFor.format('DD MMM YYYY, HH:mm') : 'Scheduled',
      icon: Clock,
      color: '#059669'
    },
    {
      label: 'Audience Type',
      value: dataSource === 'optigo' ? 'CRM' : 'Excel',
      icon: Filter,
      color: '#0891b2'
    },
    {
      label: 'Audience Size',
      value: audience.length || 0,
      icon: Users,
      color: '#dc2626'
    },
    {
      label: 'Messages',
      value: '1',
      icon: MessageSquare,
      color: '#7c3aed'
    }
  ];

  return (
    <div className={styles.formCard}>
      <Typography variant="h6" className={styles.formTitle}>Preview & Save</Typography>

      {/* Summary Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid
            key={index}
            size={{
              lg: index < 3 ? 4 : 6,
              md: index < 3 ? 4 : 6,
              sm: 6,
              xs: 12
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                height: '100%'
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-2nd-color)'
                }}
              >
                {card.label}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--text-1st-color)'
                  }}
                >
                  {card.value}
                </Typography>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${card.color}15`,
                    color: card.color
                  }}
                >
                  <card.icon size={18} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Validation Status */}
      <div className={styles.validationSection}>
        <div className={styles.validationItem}>
          <CheckCircle size={16} className={campaignName ? styles.validationSuccess : styles.validationError} />
          <span className={styles.validationText}>{campaignName ? 'Campaign name provided' : 'Campaign name required'}</span>
        </div>
        <div className={styles.validationItem}>
          <CheckCircle size={16} className={audience.length > 0 ? styles.validationSuccess : styles.validationError} />
          <span className={styles.validationText}>{audience.length > 0 ? 'Audience selected' : 'Audience required'}</span>
        </div>
        <div className={styles.validationItem}>
          <CheckCircle size={16} className={messageConfigured ? styles.validationSuccess : styles.validationError} />
          <span className={styles.validationText}>{messageConfigured ? 'Message configured' : 'Message configuration required'}</span>
        </div>
      </div>

      {/* Warning */}
      <div className={styles.infoAlert}>
        <AlertCircle size={18} className={styles.alertIcon} />
        <div className={styles.alertContent}>
          <Typography variant="body2" className={styles.alertMessage}>
            Once you save and trigger this campaign, messages will start sending immediately. Please review all details before proceeding.
          </Typography>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.formActions}>
        <Button variant="outlined" className='varientOutlinedBtn' onClick={onBack} disabled={isSaving}>
          Back
        </Button>
        <Button variant="contained" className='buttonClassname' onClick={handleSaveClick} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save & Launch'}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        title="Save & Launch Campaign"
        description="Are you sure you want to save and launch this campaign? Once launched, messages will start sending immediately."
        icon={Send}
      />
    </div>
  );
};

export default PreviewSave;
