import React from 'react';
import { Paper, Typography, TextField, Tooltip, IconButton } from '@mui/material';
import { Smile, Code } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const iconButtonSx = {
    color: 'var(--secondary-color)',
    padding: '6px',
    borderRadius: '8px',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        background: 'rgba(115, 103, 240, 0.15)',
        color: 'var(--primary-main)',
        borderRadius: '8px'
    }
};

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
    onBold,
    onItalic,
    onStrikethrough,
    onCode,
    onAddVariablePlaceholder,
    onVariableValueChange,
}) => {
    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Typography className={styles.sectionTitle}>Body</Typography>
            <Typography className={styles.sectionSubtitle}>Enter the text for your message in the language that you've selected.</Typography>
            <TextField
                multiline
                minRows={6}
                fullWidth
                placeholder="Enter body text"
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                error={saveError === 'Template body is required.'}
                helperText={saveError === 'Template body is required.' ? 'This field is required' : (templateType === 'Carousel' ? 'Introductory text for the carousel.' : '')}
            />
            <div className={styles.bodyFooterRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', position: 'relative' }}>
                <Typography className={styles.charCounter} sx={{ color: 'var(--secondary-color)', fontSize: '0.75rem' }}>
                    Characters: {bodyCharCount}/1024
                </Typography>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tooltip title="Add Emoji">
                        <IconButton size="small" sx={iconButtonSx} onClick={onToggleEmoji}>
                            <Smile size={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Bold">
                        <IconButton size="small" sx={{ ...iconButtonSx, fontWeight: 'bold' }} onClick={onBold}>
                            B
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Italic">
                        <IconButton size="small" sx={{ ...iconButtonSx, fontStyle: 'italic' }} onClick={onItalic}>
                            I
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Strikethrough">
                        <IconButton size="small" sx={{ ...iconButtonSx, textDecoration: 'line-through' }} onClick={onStrikethrough}>
                            S
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Code">
                        <IconButton size="small" sx={iconButtonSx} onClick={onCode}>
                            <Code size={18} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Variable Placeholder">
                        <IconButton size="small" sx={iconButtonSx} onClick={onAddVariablePlaceholder}>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 600 }}>{`{ }`}</Typography>
                        </IconButton>
                    </Tooltip>
                </div>
                {emojiPickerOpen && (
                    <div style={{ position: 'absolute', right: 0, bottom: '100%', marginBottom: '8px', zIndex: 9999 }}>
                        <Picker data={data} onEmojiSelect={onEmojiSelect} theme="light" />
                    </div>
                )}
            </div>
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
