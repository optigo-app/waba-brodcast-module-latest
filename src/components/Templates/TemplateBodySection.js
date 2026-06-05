import React from 'react';
import { Paper, Typography, TextField } from '@mui/material';
import TemplateBodyInput from './TemplateBodyInput';

const TemplateBodySection = ({
    styles,
    body,
    templateType,
    saveError,
    bodyCharCount,
    emojiPickerOpen,
    variableKeys,
    variableValues,
    onBodyChange,
    onToggleEmoji,
    onEmojiSelect,
    onAddVariablePlaceholder,
    onVariableValueChange,
}) => {
    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Typography className={styles.sectionTitle}>Body <span style={{ color: 'red' }}>*</span></Typography>
            <Typography className={styles.sectionSubtitle}>Enter the text for your message in the language that you've selected.</Typography>
            <TemplateBodyInput
                value={body}
                onChange={(value) => onBodyChange(value)}
                placeholder="Enter body text"
                minRows={6}
                maxRows={12}
                maxLength={1024}
                error={saveError === 'Template body is required.'}
                helperText={saveError === 'Template body is required.' ? 'This field is required' : ''}
                showCharCounter={true}
                showFormatting={true}
                showEmoji={true}
                showVariableButton={true}
                emojiPickerOpen={emojiPickerOpen}
                onToggleEmoji={onToggleEmoji}
                onEmojiSelect={onEmojiSelect}
                onAddVariablePlaceholder={onAddVariablePlaceholder}
                styles={styles}
            />
            {variableKeys.length > 0 && (
                <div className={styles.variableSection}>
                    <Typography className={styles.variableTitle} style={{ marginBottom: 8 }}>Sample variable values</Typography>
                    <div className={styles.variableInputList}>
                        {variableKeys.map((key) => (
                            <TextField
                                key={key}
                                fullWidth
                                size="small"
                                label={`{{${key}}} sample`}
                                value={variableValues[key] || ''}
                                onChange={(e) => onVariableValueChange(key, e.target.value)}
                                placeholder="e.g. John"
                            />
                        ))}
                    </div>
                </div>
            )}
        </Paper>
    );
};

export default TemplateBodySection;
