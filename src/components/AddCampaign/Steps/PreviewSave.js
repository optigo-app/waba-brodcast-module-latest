import React, { useState } from 'react';
import { Typography, Button, Grid, Box, Paper } from '@mui/material';
import { Send, ChevronLeft, CheckCircle, AlertCircle, Megaphone, Clock, Filter, Users, MessageSquare } from 'lucide-react';
import styles from '../AddCampaign.module.scss';
import ConfirmationModal from '../../ConfirmationModal/ConfirmationModal';
import MessagePreview from '../../MessagePreview/MessagePreview';

const PreviewSave = ({ onBack, onSave, campaignName, campaignType, scheduledFor, audience, dataSource, repeat, recurrenceFrequency, messageConfigured, onNavigateToStep, isSaving, templateData }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Extract preview data from templateData
  const previewData = React.useMemo(() => {
    if (!templateData?.Components) return null;

    try {
      const components = templateData.Components;
      let mediaUrls = [];
      if (Array.isArray(templateData.MediaUrls)) {
        mediaUrls = templateData.MediaUrls.filter(Boolean);
      } else if (typeof templateData.MediaUrls === 'string' && templateData.MediaUrls.trim()) {
        try {
          const parsedMediaUrls = JSON.parse(templateData.MediaUrls);
          mediaUrls = Array.isArray(parsedMediaUrls) ? parsedMediaUrls.filter(Boolean) : [];
        } catch {
          mediaUrls = [];
        }
      } else if (Array.isArray(templateData.MediaData)) {
        mediaUrls = templateData.MediaData.filter(Boolean);
      } else if (typeof templateData.MediaData === 'string' && templateData.MediaData.trim()) {
        try {
          const parsedMediaData = JSON.parse(templateData.MediaData);
          mediaUrls = Array.isArray(parsedMediaData) ? parsedMediaData.filter(Boolean) : [];
        } catch {
          mediaUrls = [];
        }
      }
      const variables = templateData.variables || {};

      const header = components.find(c => c.type === 'HEADER');
      const body = components.find(c => c.type === 'BODY');
      const footer = components.find(c => c.type === 'FOOTER');
      const buttons = components.find(c => c.type === 'BUTTONS');
      const carousel = components.find(c => String(c?.type || '').toUpperCase() === 'CAROUSEL');
      const isCarousel = Array.isArray(carousel?.cards);

      let previewHeaderType = 'None';
      let previewHeaderText = '';
      let previewHeaderTextExample = '';
      let previewHeaderMedia = null;
      let previewFooter = '';
      let previewButtons = [];
      let previewCarouselCards = [];
      let previewTemplateType = 'Interactive';

      if (isCarousel) {
        previewTemplateType = 'Carousel';
        previewCarouselCards = carousel.cards.map((card, idx) => {
          const cardComps = card.components || [];
          const cardHeader = cardComps.find(c => String(c?.type || '').toUpperCase() === 'HEADER');
          const cardBody = cardComps.find(c => String(c?.type || '').toUpperCase() === 'BODY');
          const cardButtons = cardComps.find(c => String(c?.type || '').toUpperCase() === 'BUTTONS');
          const cardHandle = cardHeader?.example?.header_handle?.[0] || '';
          const cardMediaUrl = mediaUrls[idx] || cardHandle;
          const cardFormat = (cardHeader?.format || 'IMAGE').toLowerCase();

          return {
            id: card.id || idx,
            header: {
              mediaType: cardFormat,
              file: null,
              existingHandle: cardHandle,
              mediaUrl: cardMediaUrl,
            },
            body: cardBody?.text || '',
            buttons: (cardButtons?.buttons || []).map((b, bIdx) => ({
              id: b.id || bIdx,
              type: b.type,
              text: b.text,
              phone_number: b.phone_number,
              url: b.url,
              urlType: b.url_type === 'DYNAMIC' ? 'DYNAMIC' : 'STATIC',
              example: b.example,
            })),
          };
        });
      } else {
        if (header) {
          if (header.format === 'TEXT') {
            previewHeaderType = 'Text';
            previewHeaderText = header.text || '';
            previewHeaderTextExample = header.example?.header_text?.[0] || '';
          } else {
            previewHeaderType = 'Media';
            const headerHandle = header.example?.header_handle?.[0] || '';
            const headerFormat = (header.format || 'IMAGE').toLowerCase();
            previewHeaderMedia = {
              mediaType: headerFormat,
              file: null,
              existingHandle: headerHandle,
              mediaUrl: mediaUrls[0] || headerHandle,
            };
          }
        }

        previewFooter = footer?.text || '';
        previewButtons = (buttons?.buttons || []).map((b, idx) => ({
          id: b.id || idx,
          type: b.type,
          text: b.text,
          phone_number: b.phone_number,
          url: b.url,
          urlType: b.url_type === 'DYNAMIC' ? 'DYNAMIC' : 'STATIC',
          example: b.example,
        }));
      }

      return {
        headerType: previewHeaderType,
        headerText: previewHeaderText,
        headerTextExample: previewHeaderTextExample,
        headerMedia: previewHeaderMedia,
        footer: previewFooter,
        buttons: previewButtons,
        templateType: previewTemplateType,
        carouselCards: previewCarouselCards,
        body: body?.text || '',
        variableValues: variables,
      };
    } catch (error) {
      console.error('Error extracting preview data:', error);
      return null;
    }
  }, [templateData]);

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
        <Grid size={{ xs: 12 }}>
          <Paper className={styles.summaryCard} elevation={0}>
            <Box className={styles.summaryCardContent}>
              {previewData ? (
                <MessagePreview
                  headerType={previewData.headerType}
                  headerText={previewData.headerText}
                  headerTextExample={previewData.headerTextExample}
                  headerMedia={previewData.headerMedia}
                  body={previewData.body}
                  footer={previewData.footer}
                  buttons={previewData.buttons}
                  templateType={previewData.templateType}
                  carouselCards={previewData.carouselCards}
                  variableValues={previewData.variableValues}
                  showEmptyHint={false}
                />
              ) : (
                <Typography className={styles.emptyMessageText}>No message configured</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

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
