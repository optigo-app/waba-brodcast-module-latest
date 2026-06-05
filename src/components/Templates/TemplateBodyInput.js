import React from 'react';
import { TextField, Tooltip, IconButton, Typography } from '@mui/material';
import { Smile, Code, Bold, Italic, Strikethrough, Braces } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import styles from './TemplateBodyInput.module.scss';

const iconButtonSx = {
    color: 'var(--secondary-color)',
    padding: '6px',
    borderRadius: '8px',
    transition: 'all 0.2s ease-in-out',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
        background: 'rgba(115, 103, 240, 0.15)',
        color: 'var(--primary-main)',
        borderRadius: '8px'
    }
};

const TemplateBodyInput = ({
    value = '',
    onChange,
    placeholder = 'Enter body text',
    minRows = 6,
    maxRows = 12,
    maxLength = 1024,
    error = false,
    helperText = '',
    showCharCounter = true,
    showFormatting = true,
    showEmoji = true,
    showVariableButton = false,
    emojiPickerOpen = false,
    onToggleEmoji,
    onEmojiSelect,
    onAddVariablePlaceholder,
    styles = {},
    parentStyles = {},
}) => {
    const charCount = value.length;
    const textareaRef = React.useRef(null);

    const wrapSelectedText = (prefix, suffix) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);

        if (selectedText) {
            const newValue = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
            onChange(newValue);
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + prefix.length, end + prefix.length);
            }, 0);
        } else {
            onChange(value + prefix + suffix);
        }
    };

    const handleBold = () => {
        wrapSelectedText('*', '*');
    };

    const handleItalic = () => {
        wrapSelectedText('_', '_');
    };

    const handleStrikethrough = () => {
        wrapSelectedText('~', '~');
    };

    const handleCode = () => {
        wrapSelectedText('```', '```');
    };

    return (
        <>
            <TextField
                multiline
                minRows={minRows}
                maxRows={maxRows}
                fullWidth
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                error={error}
                helperText={helperText}
                inputRef={textareaRef}
            />
            <div className={`${styles.bodyFooterRow} ${parentStyles?.bodyFooterRow || ''}`}>
                {showCharCounter && (
                    <Typography className={`${styles.charCounter} ${parentStyles?.charCounter || ''}`} sx={{ color: 'var(--secondary-color)', fontSize: '0.75rem' }}>
                        Characters: {charCount}/{maxLength}
                    </Typography>
                )}
                {showFormatting && (
                    <div className={styles.formattingButtons} style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }}>
                        {showEmoji && (
                            <Tooltip title="Add Emoji">
                                <IconButton size="small" sx={iconButtonSx} onClick={onToggleEmoji}>
                                    <Smile size={16} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Bold">
                            <IconButton size="small" sx={iconButtonSx} onClick={handleBold}>
                                <Bold size={16} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Italic">
                            <IconButton size="small" sx={iconButtonSx} onClick={handleItalic}>
                                <Italic size={16} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Strikethrough">
                            <IconButton size="small" sx={iconButtonSx} onClick={handleStrikethrough}>
                                <Strikethrough size={16} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Code">
                            <IconButton size="small" sx={iconButtonSx} onClick={handleCode}>
                                <Code size={16} />
                            </IconButton>
                        </Tooltip>
                        {showVariableButton && (
                            <Tooltip title="Add Variable Placeholder">
                                <IconButton size="small" sx={iconButtonSx} onClick={onAddVariablePlaceholder}>
                                    <Braces size={16} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                )}
                {emojiPickerOpen && (
                    <div className={styles.emojiPickerWrapper}>
                        <Picker data={data} onEmojiSelect={onEmojiSelect} theme="light" />
                    </div>
                )}
            </div>
        </>
    );
};

export default TemplateBodyInput;
