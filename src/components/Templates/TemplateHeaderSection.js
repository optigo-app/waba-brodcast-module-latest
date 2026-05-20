import React from 'react';
import { Paper, Typography, TextField, Button, LinearProgress } from '@mui/material';
import { Image, Video, FileText, MapPin, Paperclip } from 'lucide-react';

const TemplateHeaderSection = ({
    styles,
    builderData,
    headerMedia,
    headerOptions,
    mediaConfig,
    isUploading,
    uploadProgress,
    onHeaderTypeChange,
    onHeaderTextChange,
    onHeaderTextExampleChange,
    onHeaderMediaTypeChange,
    onHeaderMediaFileChange,
}) => {
    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Typography className={styles.sectionTitle}>Header</Typography>
            <Typography className={styles.sectionSubtitle}>Add a title or choose which type of media you'll use for this header.</Typography>

            <div className={styles.chipRow}>
                {headerOptions.map((opt) => {
                    const { icon: Icon, label, key } = opt;
                    const isSelected = builderData.headerType === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            className={`${styles.choiceChip} ${isSelected ? styles.activeChip : ''}`}
                            onClick={() => onHeaderTypeChange(key)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    );
                })}
            </div>

            {builderData.headerType === 'Text' && (
                <div className={styles.headerTextWrap}>
                    <div className={styles.sectionHeaderRow}>
                        <Typography className={styles.variableTitle}>Header Text</Typography>
                        <Typography className={styles.charCounter}>{builderData.headerText.length}/60</Typography>
                    </div>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Our {{1}} is on!"
                        value={builderData.headerText}
                        onChange={(e) => onHeaderTextChange(e.target.value.slice(0, 60))}
                    />
                    {/\{\{1\}\}/.test(builderData.headerText) && (
                        <TextField
                            fullWidth
                            size="small"
                            label="Sample value for {{1}}"
                            value={builderData.headerTextExample}
                            onChange={(e) => onHeaderTextExampleChange(e.target.value)}
                            placeholder="e.g. Summer Sale"
                            style={{ marginTop: 8 }}
                        />
                    )}
                </div>
            )}

            {builderData.headerType === 'Media' && (
                <div className={styles.mediaPickerWrap}>
                    <div className={styles.mediaIconGrid}>
                        {[
                            { type: 'image', Icon: Image, label: 'Image' },
                            { type: 'video', Icon: Video, label: 'Video' },
                            { type: 'document', Icon: FileText, label: 'Document' },
                            { type: 'location', Icon: MapPin, label: 'Location' },
                        ].map(({ type, Icon, label }) => (
                            <button
                                key={type}
                                type="button"
                                className={`${styles.mediaIconCard} ${headerMedia.mediaType === type ? styles.mediaIconCardActive : ''}`}
                                onClick={() => onHeaderMediaTypeChange(type)}
                            >
                                {headerMedia.mediaType === type && (
                                    <span className={styles.mediaIconCheck}>✓</span>
                                )}
                                <Icon size={28} className={styles.mediaIconSvg} />
                                <span className={styles.mediaIconLabel}>{label}</span>
                                {type === 'location' && <span className={styles.mediaIconSoon}>soon</span>}
                            </button>
                        ))}
                    </div>

                    {headerMedia.mediaType !== 'location' && (
                        <div className={styles.mediaSampleBox}>
                            <Typography className={styles.mediaSampleTitle}>Sample for header content</Typography>
                            <Typography className={styles.mediaSampleDesc}>
                                To help Meta review your content, provide examples of the variables or media in the header.
                                Do not include any customer information.
                            </Typography>

                            {!headerMedia.file && headerMedia.existingHandle && (
                                <div className={styles.existingMediaRow}>
                                    {headerMedia.mediaType === 'image' && (
                                        <img
                                            src={headerMedia.existingHandle}
                                            alt="Current header"
                                            className={styles.existingMediaThumb}
                                        />
                                    )}
                                    {headerMedia.mediaType === 'video' && (
                                        <div className={styles.existingMediaVideo}>
                                            <Video size={18} />
                                            <span>Current video</span>
                                        </div>
                                    )}
                                    {headerMedia.mediaType === 'document' && (
                                        <div className={styles.existingMediaVideo}>
                                            <FileText size={18} />
                                            <span>Current document</span>
                                        </div>
                                    )}
                                    <Typography className={styles.existingMediaLabel}>
                                        Current file will be kept. Upload a new file to replace it.
                                    </Typography>
                                </div>
                            )}

                            <div className={styles.mediaSampleActions}>
                                <Button
                                    component="label"
                                    className={styles.mediaUploadBtn}
                                    startIcon={<Paperclip size={14} />}
                                >
                                    {headerMedia.existingHandle && !headerMedia.file ? 'Replace file' : `Choose ${headerMedia.mediaType === 'image' ? 'JPG or PNG' : headerMedia.mediaType === 'video' ? 'MP4' : 'PDF'} file`}
                                    <input
                                        hidden
                                        type="file"
                                        accept={mediaConfig[headerMedia.mediaType]?.mimes.join(',')}
                                        onChange={onHeaderMediaFileChange}
                                    />
                                </Button>
                                {headerMedia.file && (
                                    <Typography className={styles.mediaFileName}>{headerMedia.file.name}</Typography>
                                )}
                            </div>
                            <div className={styles.mediaHint}>
                                <Typography variant="caption" color="textSecondary">
                                    Supported: {mediaConfig[headerMedia.mediaType]?.extensions} (Max {mediaConfig[headerMedia.mediaType]?.maxSizeLabel})
                                </Typography>
                                {mediaConfig[headerMedia.mediaType]?.extraNote && (
                                    <Typography variant="caption" color="textSecondary" style={{ display: 'block', fontStyle: 'italic' }}>
                                        {mediaConfig[headerMedia.mediaType].extraNote}
                                    </Typography>
                                )}
                            </div>
                            {isUploading && (
                                <div className={styles.uploadProgressBox}>
                                    <div className={styles.uploadProgressMeta}>
                                        <span>Uploading to Meta...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <LinearProgress
                                        variant="determinate"
                                        value={uploadProgress}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: 'rgba(115, 103, 240, 0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 3,
                                                backgroundColor: '#7367f0'
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Paper>
    );
};

export default TemplateHeaderSection;
