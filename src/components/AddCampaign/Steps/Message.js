import React, { useState, useEffect, useCallback } from 'react';
import { Typography, TextField, Button, RadioGroup, Radio, FormControlLabel, Select, MenuItem, Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Menu, ListItemText, ListItemIcon, Popover, Skeleton } from '@mui/material';
import { Smile, Code, Send, Info, ChevronDown, User } from 'lucide-react';
import SelectAutocomplete from '../../Audience/SelectAutocomplete';
import { fetchTemplateLists } from '../../../API/TemplateList/TemplateList';
import { useAuthToken } from '../../../hooks/useAuthToken';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import MessagePreview from '../../MessagePreview/MessagePreview';
import TemplateVariableInput from '../../Common/TemplateVariableInput/TemplateVariableInput';
import DynamicVariableMenu from '../../Common/DynamicVariableMenu/DynamicVariableMenu';
import SendTemplateDialog from '../../Common/SendTemplateDialog/SendTemplateDialog';
import toast from 'react-hot-toast';
import styles from '../AddCampaign.module.scss';

// ── Local Input Wrapper for General Performance ──────────────────────────────
const LocalTextField = React.memo(({ value, onChange, ...props }) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  return (
    <TextField
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value) {
          onChange(localValue);
        }
      }}
    />
  );
});



const Message = ({ onNext, onBack, onMessageConfigured, showError, messageError, onTemplateData }) => {
  const { userToken } = useAuthToken();
  const [messageType, setMessageType] = useState('preApprovedTemplate');
  const [template, setTemplate] = useState(null);
  const [deleteTemplate, setDeleteTemplate] = useState(false);
  const [variables, setVariables] = useState({});
  const [autoFillDialogOpen, setAutoFillDialogOpen] = useState(false);
  const [autoFillText, setAutoFillText] = useState('');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [variableCount, setVariableCount] = useState(0);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [regularMessageType, setRegularMessageType] = useState('Text');
  const [regularMessageText, setRegularMessageText] = useState('');
  const [variableMenuAnchor, setVariableMenuAnchor] = useState(null);
  const [selectedVariableIndex, setSelectedVariableIndex] = useState(null);
  const [sendTestDialogOpen, setSendTestDialogOpen] = useState(false);

  const handleVariableMenuOpen = (event, index) => {
    setVariableMenuAnchor(event.currentTarget);
    setSelectedVariableIndex(index);
  };

  const handleVariableMenuClose = () => {
    setVariableMenuAnchor(null);
    setSelectedVariableIndex(null);
  };

  const handleVariableSelect = (variableValue) => {
    if (selectedVariableIndex !== null) {
      setVariables(prev => ({
        ...prev,
        [selectedVariableIndex + 1]: variableValue
      }));
    }
    handleVariableMenuClose();
  };

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!userToken?.userId) return;
      setTemplatesLoading(true);
      try {
        const response = await fetchTemplateLists(userToken.userId);
        if (response?.data) {
          setTemplates(response.data);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setTemplatesLoading(false);
      }
    };
    fetchTemplates();
  }, [userToken?.userId]);

  // Parse template to get variable count
  useEffect(() => {
    if (!template) {
      setVariableCount(0);
      setVariables({});
      onTemplateData?.(null);
      return;
    }

    try {
      // Parse Components to extract variable count
      const components = JSON.parse(template.Components);
      let mediaUrls = [];
      try {
        if (Array.isArray(template.MediaData)) {
          mediaUrls = template.MediaData.filter(Boolean);
        } else if (typeof template.MediaData === 'string' && template.MediaData.trim()) {
          const parsedMedia = JSON.parse(template.MediaData);
          mediaUrls = Array.isArray(parsedMedia) ? parsedMedia.filter(Boolean) : [];
        }
      } catch (mediaError) {
        console.error('Error parsing template media data:', mediaError);
      }

      if (components && components.length > 0) {
        const bodyComponent = components.find(c => c.type === 'BODY');
        if (bodyComponent && bodyComponent.text) {
          // Count {{1}}, {{2}}, etc. placeholders
          const matches = bodyComponent.text.match(/\{\{\d+\}\}/g);
          const count = matches ? matches.length : 0;
          setVariableCount(count);

          // Initialize variables object if count changes - Pre-fill with sample values if available
          const newVars = {};
          const bodyExample = bodyComponent?.example?.body_text?.[0] || [];
          for (let i = 1; i <= count; i++) {
            newVars[i] = bodyExample[i - 1] || '';
          }
          setVariables(newVars);

          // Pass template data to parent
          const templateData = {
            TemplateId: template.TemplateId || template.Id,
            WabaTemplateId: template.WabaTemplateId,
            TemplateJson: template.TemplateJson,
            Components: components,
            MediaUrls: mediaUrls,
            variables: newVars
          };
          onTemplateData?.(templateData);
        } else {
          setVariableCount(0);
          setVariables({});
          onTemplateData?.({
            TemplateId: template.TemplateId || template.Id,
            WabaTemplateId: template.WabaTemplateId,
            TemplateJson: template.TemplateJson,
            Components: components,
            MediaUrls: mediaUrls,
            variables: {}
          });
        }
      } else {
        setVariableCount(0);
        setVariables({});
        onTemplateData?.(null);
      }
    } catch (error) {
      console.error('Error parsing template components:', error);
      setVariableCount(0);
      setVariables({});
      onTemplateData?.(null);
    }
  }, [template, onTemplateData]);

  const getTemplateLabel = (option) => {
    if (!option) return '';
    return `${option.TemplateName} (${option.TemplateType})`;
  };

  const handleVariableChange = useCallback((index, value) => {
    setVariables(prev => {
      if (prev[index] === value) return prev;
      return {
        ...prev,
        [index]: value
      };
    });
  }, []);

  const handleEmojiPickerOpen = (event, index) => {
    setEmojiAnchorEl(event.currentTarget);
    setEmojiPickerOpen(index !== undefined ? index : 'regularMessage');
  };

  const handleEmojiPickerClose = () => {
    setEmojiPickerOpen(null);
    setEmojiAnchorEl(null);
  };

  const handleEmojiSelect = (emoji) => {
    if (emojiPickerOpen === 'regularMessage') {
      setRegularMessageText(prev => prev + emoji.native);
    } else if (emojiPickerOpen !== null) {
      const currentValue = variables[emojiPickerOpen] || '';
      setVariables(prev => ({
        ...prev,
        [emojiPickerOpen]: currentValue + emoji.native
      }));
    }
    handleEmojiPickerClose();
  };

  // Show preview column when: template is selected (preApproved) OR regular message mode
  const showPreview = (messageType === 'preApprovedTemplate' && template !== null) || messageType === 'regularMessage';

  // Check if message is configured
  useEffect(() => {
    let isConfigured = false;

    if (messageType === 'preApprovedTemplate') {
      // Check if template is selected and all variables are filled
      if (template) {
        const allVarsFilled = Object.values(variables).every(val => val && val.trim() !== '');
        isConfigured = variableCount === 0 || allVarsFilled;
      }
    } else if (messageType === 'regularMessage') {
      // Check if message text is not empty
      isConfigured = regularMessageText && regularMessageText.trim() !== '';
    }

    onMessageConfigured?.(isConfigured);
  }, [messageType, template, variables, variableCount, regularMessageText, onMessageConfigured]);

  // Update template data when variables change - Debounced
  useEffect(() => {
    if (template && variableCount > 0) {
      const timer = setTimeout(() => {
        try {
          const components = JSON.parse(template.Components);
          let mediaUrls = [];
          try {
            if (Array.isArray(template.MediaData)) {
              mediaUrls = template.MediaData.filter(Boolean);
            } else if (typeof template.MediaData === 'string' && template.MediaData.trim()) {
              const parsedMedia = JSON.parse(template.MediaData);
              mediaUrls = Array.isArray(parsedMedia) ? parsedMedia.filter(Boolean) : [];
            }
          } catch (mediaError) {
            console.error('Error parsing template media data:', mediaError);
          }

          onTemplateData?.({
            TemplateId: template.TemplateId || template.Id,
            WabaTemplateId: template.WabaTemplateId,
            TemplateJson: template.TemplateJson,
            Components: components,
            MediaUrls: mediaUrls,
            variables
          });
        } catch (error) {
          console.error('Error parsing template components:', error);
        }
      }, 400); // Larger debounce for the heavy parent update
      return () => clearTimeout(timer);
    }
  }, [variables, template, variableCount, onTemplateData]);

  return (
    <div className={styles.formCard}>
      <Grid container spacing={4}>
        {/* Left: Form */}
        <Grid size={{ lg: showPreview ? 8 : 12, md: showPreview ? 8 : 12, sm: 12, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Message Type */}
          <div className={styles.formField}>
            <label className={styles.label}>Message Type</label>
            <RadioGroup
              row
              value={messageType}
              onChange={(e) => {
                if (e.target.value === 'regularMessage') {
                  toast('Regular Message coming soon...', { icon: '🚧' });
                  return;
                }
                setMessageType(e.target.value);
              }}
              className={styles.messageTypeRadioGroup}
            >
              <FormControlLabel
                value="preApprovedTemplate"
                control={<Radio />}
                label="Pre Approved Template"
                className={styles.radioLabel}
              />
              <FormControlLabel
                value="regularMessage"
                control={<Radio />}
                label="Regular Message"
                className={styles.radioLabel}
              />
            </RadioGroup>

            {/* Info Box - Conditional based on message type */}
            <Box className={styles.infoAlert}>
              <Info size={18} className={styles.alertIcon} />
              <Typography variant="body2" className={styles.alertMessage}>
                {messageType === 'preApprovedTemplate'
                  ? 'Pre-Approved Template messages are approved by Meta and ensure delivery. If your recipient has not messaged you in last 24 Hours, regular messages can not be delivered where Pre-Approved messages can be delivered out of this window.'
                  : 'Regular messages are delivered in 24 Hours Active Session Window. If your recipient has not messages you in last 24 Hours, these messages will not be delivered. You can use Pre-Approved Template Messages to ensure delivery. You can also use system field Last Seen Timestamp to filter the audience with active session.'}
              </Typography>
            </Box>

            {messageError && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fee2e2', borderRadius: '8px', border: '1px solid #ef4444' }}>
                <Typography sx={{ color: '#dc2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Message configuration is required. Please configure your message before proceeding.
                </Typography>
              </Box>
            )}
          </div>

          {/* Template Section - Only show for Pre Approved Template */}
          {messageType === 'preApprovedTemplate' && (
            <div className={styles.formField} style={{ marginBottom: '1rem' }}>
              <label className={styles.label}>Template</label>
              {templatesLoading ? (
                <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: '8px' }} />
              ) : (
                <SelectAutocomplete
                  value={template}
                  onChange={(e, newValue) => setTemplate(newValue)}
                  options={templates}
                  placeholder="Select a template"
                  getOptionLabel={getTemplateLabel}
                  disabled={templatesLoading}
                />
              )}
            </div>
          )}

          {/* Regular Message Section - Only show for Regular Message */}
          {messageType === 'regularMessage' && (
            <>
              {/* Regular Message Type */}
              <div className={styles.formField}>
                <label className={styles.label}>Message Type</label>
                <Select
                  value={regularMessageType}
                  onChange={(e) => setRegularMessageType(e.target.value)}
                  variant="outlined"
                  size="small"
                  className={styles.textField}
                  fullWidth
                >
                  <MenuItem value="Text">Text</MenuItem>
                  <MenuItem value="Image">Image</MenuItem>
                  <MenuItem value="Document">Document</MenuItem>
                  <MenuItem value="Video">Video</MenuItem>
                </Select>
              </div>

              {/* Text Message Area */}
              <div className={styles.formField}>
                <label className={styles.label}>Message</label>
                <LocalTextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Start typing..."
                  value={regularMessageText}
                  onChange={(val) => setRegularMessageText(val)}
                  variant="outlined"
                  className={styles.textField}
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        <Typography variant="caption" className={styles.charCount}>
                          {regularMessageText.length} characters
                        </Typography>
                        <Tooltip title="Add Emoji">
                          <IconButton
                            size="small"
                            className={styles.inputIconButton}
                            onClick={(e) => handleEmojiPickerOpen(e, 'regularMessage')}
                          >
                            <Smile size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ),
                  }}
                />
              </div>
            </>
          )}

          {/* Auto Fill Button - Only show for Pre Approved Template with variables */}
          {messageType === 'preApprovedTemplate' && variableCount > 0 && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 1.5 }}>
              <Button
                variant='contained'
                className='secondaryBtnClassname'
                onClick={() => setAutoFillDialogOpen(true)}
              >
                Auto Fill Body Variables
              </Button>
            </Box>
          )}

          {/* Variables Section - Only show for Pre Approved Template */}
          {messageType === 'preApprovedTemplate' && variableCount > 0 && (
            <div className={`${styles.variablesSection} ${variableCount > 4 ? styles.threeColumns : ''} ${variableCount > 9 ? styles.fourColumns : ''}`}>
              {Array.from({ length: variableCount }, (_, i) => i + 1).map(index => (
                <TemplateVariableInput
                  key={index}
                  label={`BODY VARIABLE #${index}`}
                  value={variables[index] || ''}
                  onChange={(val) => handleVariableChange(index, val)}
                  onEmojiClick={(e) => handleEmojiPickerOpen(e, index)}
                  onVariableClick={(e) => handleVariableMenuOpen(e, index - 1)}
                  className={styles.variableInput}
                />
              ))}
            </div>
          )}

          {/* Dynamic Variables Menu */}
          <DynamicVariableMenu
            anchorEl={variableMenuAnchor}
            open={Boolean(variableMenuAnchor)}
            onClose={handleVariableMenuClose}
            onSelect={handleVariableSelect}
          />

          {/* Send Test Message Button */}
          {(messageType === 'preApprovedTemplate' && template) && (
            <Box className={styles.sendTestButtonContainer}>
              <Button
                variant="contained"
                className='secondaryBtnClassname'
                startIcon={<Send size={18} />}
                onClick={() => setSendTestDialogOpen(true)}
              >
                Send Test Message
              </Button>
            </Box>
          )}

          {/* Auto Fill Dialog - Only show for Pre Approved Template */}
          {messageType === 'preApprovedTemplate' && (
            <Dialog
              open={autoFillDialogOpen}
              onClose={() => setAutoFillDialogOpen(false)}
              maxWidth="md"
              fullWidth
              PaperProps={{ className: styles.autoFillDialogPaper }}
            >
              <DialogTitle className={styles.dialogTitle}>Auto Fill Body Variables</DialogTitle>
              <DialogContent className={styles.dialogContent}>
                <Typography variant="body2" className={styles.dialogHelperText}>
                  Enter values separated by commas or new lines. Each value will be assigned to a variable in order.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Enter variable values separated by commas or new lines...&#10;Example: John, jane@example.com, +919876543210"
                  value={autoFillText}
                  onChange={(e) => setAutoFillText(e.target.value)}
                  variant="outlined"
                  className={styles.autoFillTextArea}
                />
              </DialogContent>
              <DialogActions className={styles.dialogActions}>
                <Button onClick={() => setAutoFillDialogOpen(false)} className='varientOutlinedBtn'>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Parse text by comma or new line
                    const values = autoFillText
                      .split(/[\n,]+/)
                      .map(v => v.trim())
                      .filter(v => v.length > 0);

                    // Fill variables in order based on variableCount
                    const newVars = {};
                    for (let i = 1; i <= variableCount; i++) {
                      if (values[i - 1]) {
                        newVars[i] = values[i - 1];
                      } else {
                        newVars[i] = variables[i] || '';
                      }
                    }
                    setVariables(newVars);

                    setAutoFillText('');
                    setAutoFillDialogOpen(false);
                  }}
                  className='buttonClassname'
                >
                  Apply
                </Button>
              </DialogActions>
            </Dialog>
          )}

          {/* Action Buttons */}
          <div className={styles.formActions}>
            <Button className='varientOutlinedBtn' onClick={onBack}>
              Back
            </Button>
            <Button className='buttonClassname' onClick={onNext}>
              Next
            </Button>
          </div>
        </Grid>

        {/* Right: Preview — only shown when showPreview is true */}
        {showPreview && (
          <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }}>
            {messageType === 'preApprovedTemplate' && template ? (
              <MessagePreview
                headerType="None"
                headerText=""
                headerTextExample=""
                headerMedia={null}
                body={template.Components ? JSON.parse(template.Components).find(c => c.type === 'BODY')?.text || '' : ''}
                footer=""
                buttons={[]}
                templateType="Interactive"
                carouselCards={[]}
                variableValues={variables}
                showEmptyHint={false}
              />
            ) : messageType === 'regularMessage' ? (
              <MessagePreview
                headerType="None"
                headerText=""
                headerTextExample=""
                headerMedia={null}
                body={regularMessageText}
                footer=""
                buttons={[]}
                templateType="Interactive"
                carouselCards={[]}
                variableValues={{}}
                showEmptyHint={false}
              />
            ) : null}
          </Grid>
        )}
      </Grid>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={handleEmojiPickerClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }
        }}
      >
        <Picker
          data={data}
          onEmojiSelect={handleEmojiSelect}
          theme="light"
        />
      </Popover>

      {/* Send Test Message Dialog */}
      <SendTemplateDialog
        open={sendTestDialogOpen}
        onClose={() => setSendTestDialogOpen(false)}
        template={template}
        userToken={userToken}
      />
    </div>
  );
};

export default Message;
