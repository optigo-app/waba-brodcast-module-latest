import { Typography, TextField, Button, Chip } from '@mui/material';
import styles from './OptionalModal1.module.scss';
import toast from 'react-hot-toast';

const mediaTypeOptions = ['image', 'video', 'document', 'location'];

const mediaAcceptMap = {
    image: 'image/jpeg,image/png,image/webp',
    video: 'video/mp4,video/3gpp',
    document: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt',
};

const HeaderMediaConfig = ({ headerMedia, setHeaderMedia }) => {
    return (
        <div className={styles.mediaSection}>
            <Typography className={styles.mediaLabel}>Media Type</Typography>
            <div className={styles.mediaTypeRow}>
                {mediaTypeOptions.map((type) => (
                    <button
                        key={type}
                        type="button"
                        className={`${styles.mediaTypeBtn} ${headerMedia.mediaType === type ? styles.mediaTypeActive : ''}`}
                        onClick={() => {
                            if (type === 'location') {
                                toast('Location header coming soon', { icon: '🚧' });
                                return;
                            }
                            setHeaderMedia((prev) => ({ ...prev, mediaType: type, file: null, mediaUrl: '' }));
                        }}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                        {type === 'location' && (
                            <span style={{ fontSize: '0.65rem', marginLeft: 4, opacity: 0.7 }}>soon</span>
                        )}
                    </button>
                ))}
            </div>

            {/* File upload + URL input for image / video / document */}
            {headerMedia.mediaType !== 'location' && (
                <>
                    <div className={styles.mediaUploadRow}>
                        <Button component="label" className={styles.mediaUploadBtn}>
                            Upload {headerMedia.mediaType}
                            <input
                                hidden
                                type="file"
                                accept={mediaAcceptMap[headerMedia.mediaType]}
                                onChange={(e) => {
                                    const selectedFile = e.target.files?.[0] || null;
                                    setHeaderMedia((prev) => ({ ...prev, file: selectedFile, mediaUrl: '' }));
                                }}
                            />
                        </Button>
                        <Typography className={styles.mediaFileName}>
                            {headerMedia.file?.name || 'No file selected'}
                        </Typography>
                    </div>

                    <div className={styles.mediaUrlRow}>
                        <TextField
                            size="small"
                            fullWidth
                            label={`${headerMedia.mediaType.charAt(0).toUpperCase() + headerMedia.mediaType.slice(1)} URL (public link)`}
                            placeholder={`https://example.com/file.${headerMedia.mediaType === 'image' ? 'jpg' : headerMedia.mediaType === 'video' ? 'mp4' : 'pdf'}`}
                            value={headerMedia.mediaUrl || ''}
                            onChange={(e) => setHeaderMedia((prev) => ({ ...prev, mediaUrl: e.target.value, file: null }))}
                        />
                    </div>

                    <Typography style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 6 }}>
                        {headerMedia.mediaType === 'image' && 'Supported: JPG, PNG, WEBP · Max 5 MB'}
                        {headerMedia.mediaType === 'video' && 'Supported: MP4, 3GPP · Max 16 MB'}
                        {headerMedia.mediaType === 'document' && 'Supported: PDF, DOC, XLS, PPT · Max 100 MB'}
                    </Typography>
                </>
            )}
        </div>
    );
};

export default HeaderMediaConfig;
