import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button, RadioGroup, Radio, FormControlLabel, Select, MenuItem, Box, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from '@mui/material';
import { Smile, Code, Send, Info } from 'lucide-react';
import SelectAutocomplete from '../../Audience/SelectAutocomplete';
import { fetchTemplateLists } from '../../../API/TemplateList/TemplateList';
import { useAuthToken } from '../../../hooks/useAuthToken';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import MessagePreview from '../../MessagePreview/MessagePreview';
import styles from '../AddCampaign.module.scss';

const Message = ({ onNext, onBack, onMessageConfigured }) => {
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
  const [regularMessageType, setRegularMessageType] = useState('Text');
  const [regularMessageText, setRegularMessageText] = useState('');

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
      return;
    }

    try {
      // Parse Components to extract variable count
      const components = JSON.parse(template.Components);
      if (components && components.length > 0) {
        const bodyComponent = components.find(c => c.type === 'BODY');
        if (bodyComponent && bodyComponent.text) {
          // Count {{1}}, {{2}}, etc. placeholders
          const matches = bodyComponent.text.match(/\{\{\d+\}\}/g);
          const count = matches ? matches.length : 0;
          setVariableCount(count);

          // Clear variables when template changes
          setVariables({});

          // Initialize variables object if count changes
          setVariables(prev => {
            const newVars = {};
            for (let i = 1; i <= count; i++) {
              newVars[i] = '';
            }
            return newVars;
          });
        } else {
          setVariableCount(0);
          setVariables({});
        }
      } else {
        setVariableCount(0);
        setVariables({});
      }
    } catch (error) {
      console.error('Error parsing template components:', error);
      setVariableCount(0);
      setVariables({});
    }
  }, [template]);

  const getTemplateLabel = (option) => {
    if (!option) return '';
    return `${option.TemplateName} (${option.TemplateType})`;
  };

  const handleVariableChange = (index, value) => {
    setVariables(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const handleEmojiPickerOpen = (index) => {
    setEmojiPickerOpen(index);
  };

  const handleEmojiPickerClose = () => {
    setEmojiPickerOpen(null);
  };

  const handleEmojiSelect = (emoji) => {
    if (emojiPickerOpen === 'regularMessage') {
      setRegularMessageText(prev => prev + emoji.native);
      handleEmojiPickerClose();
    } else if (emojiPickerOpen !== null) {
      const currentValue = variables[emojiPickerOpen] || '';
      setVariables(prev => ({
        ...prev,
        [emojiPickerOpen]: currentValue + emoji.native
      }));
      handleEmojiPickerClose();
    }
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
              onChange={(e) => setMessageType(e.target.value)}
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
          </div>

          {/* Template Section - Only show for Pre Approved Template */}
          {messageType === 'preApprovedTemplate' && (
            <div className={styles.formField}>
              <label className={styles.label}>Template</label>
              <SelectAutocomplete
                value={template}
                onChange={(e, newValue) => setTemplate(newValue)}
                options={templates}
                placeholder="Select a template"
                getOptionLabel={getTemplateLabel}
                disabled={templatesLoading}
              />

              <FormControlLabel
                control={
                  <input
                    type="checkbox"
                    checked={deleteTemplate}
                    onChange={(e) => setDeleteTemplate(e.target.checked)}
                    className={styles.checkbox}
                  />
                }
                sx={{ marginLeft: '0' }}
                label="Delete Template After Campaign Completion"
                className={styles.checkboxLabel}
              />
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
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Start typing..."
                  value={regularMessageText}
                  onChange={(e) => setRegularMessageText(e.target.value)}
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
                            onClick={() => setEmojiPickerOpen('regularMessage')}
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
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
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
                <div key={index} className={styles.variableInput}>
                  <label className={styles.variableLabel}>BODY VARIABLE #{index}</label>
                  <TextField
                    fullWidth
                    placeholder="Start typing..."
                    value={variables[index] || ''}
                    onChange={(e) => handleVariableChange(index, e.target.value)}
                    variant="outlined"
                    size="small"
                    className={styles.textField}
                    InputProps={{
                      endAdornment: (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Add Emoji">
                            <IconButton
                              size="small"
                              className={styles.inputIconButton}
                              onClick={() => handleEmojiPickerOpen(index)}
                            >
                              <Smile size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Code Snippet">
                            <IconButton size="small" className={styles.inputIconButton}>
                              <Code size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ),
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Send Test Message Button */}
          {messageType === 'preApprovedTemplate' && (
            <Box className={styles.sendTestButtonContainer}>
              <Button
                variant="contained"
                className='secondaryBtnClassname'
                startIcon={<Send size={18} />}
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

      {/* Emoji Picker */}
      {emojiPickerOpen !== null && (
        <Box className={styles.emojiPickerWrapper}>
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 9999 }}
          />
        </Box>
      )}
    </div>
  );
};

export default Message;
