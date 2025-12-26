import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react';
import { Box, Modal, Typography, IconButton } from '@mui/material';
import ComposedMessage1 from './ComposedMessage1';
import styles from './ComposedModal.module.scss';

const ComposedModal = ({
    openModal1,
    setOpenModal1,
    message = '',
    uploadedMedia,
    setUploadedMedia,
    onMessageChange,
    onSave,
    templateData,
}) => {
    const [localMessage, setLocalMessage] = useState(message);


    // Update local message when prop changes
    useEffect(() => {
        setLocalMessage(message);
    }, [message]);

    const handleMessageChange = (newData) => {
        setLocalMessage(newData.message || '');
        if (onMessageChange) {
            onMessageChange({
                ...newData,
                message: newData.message || ''
            });
        }
    };

    const handleClose = () => setOpenModal1(false);

    return (
        <Modal
            open={openModal1}
            onClose={handleClose}
            aria-labelledby="create-template-modal"
            aria-describedby="create-new-campaign-template"
            slotProps={{
                backdrop: {
                    sx: { backgroundColor: 'rgba(179, 179, 179, 0.4)', backdropFilter: 'blur(2px)' }
                }
            }}
        >
            <Box className={styles.modalBox}>
                <Box className={styles.modalHeader}>
                    <Typography className={styles.title} variant="h5">
                        Create Template
                    </Typography>
                    <IconButton
                        onClick={handleClose}
                        className={styles.closeBtn}
                        size="small"
                    >
                        <X size={24} />
                    </IconButton>
                </Box>

                <ComposedMessage1
                    openModal1={openModal1}
                    message={localMessage}
                    uploadedMedia={uploadedMedia}
                    setUploadedMedia={setUploadedMedia}
                    onMessageChange={handleMessageChange}
                    onSave={(data) => {
                        if (onSave) onSave(data);
                        handleClose();
                    }}
                    templateData={templateData}
                />
            </Box>
        </Modal>
    )
}

export default ComposedModal
