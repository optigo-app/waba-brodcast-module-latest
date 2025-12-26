import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Zap, ChevronLeft } from 'lucide-react';
import { Box, Modal, Typography, Button, IconButton } from '@mui/material';
import { fetchTemplateLists } from '../../API/TemplateList/TemplateList';
import { useAuthToken } from '../../hooks/useAuthToken';
import ComposedMessage1 from './ComposedMessage1';
import styles from './OptionalModal1.module.scss';

const OptionModal1 = ({
    openModal,
    setOpenModal,
    message,
    uploadedMedia,
    setUploadedMedia,
    quillRef,
    handleFileUpload,
    onMessageChange,
    onSave,
    templateData
}) => {
    const [step, setStep] = useState(1); // 1: Select Type, 2: Create Template
    const [selectedOption, setSelectedOption] = useState('simple');
    const { userToken } = useAuthToken();

    // Reset step when modal opens
    useEffect(() => {
        if (openModal) {
            setStep(1);
            setSelectedOption('simple');
        }
    }, [openModal]);

    const handleSelect = (option) => {
        setSelectedOption(option);
    };

    const handleContinue = async () => {
        if (selectedOption === 'automation') {
            window.open("https://chatbotbuilder1.netlify.app/", "_blank");
        } else if (selectedOption === 'simple') {
            try {
                const result = await fetchTemplateLists(userToken?.userId);
                if (result?.data) {
                    sessionStorage.setItem("templateOptions", JSON.stringify(result.data));
                    setStep(2);
                }
            } catch (err) {
                console.error('Error in handleContinue:', err);
            }
        }
    };

    const handleClose = () => {
        setOpenModal(false);
        setStep(1);
        setSelectedOption('simple');
    };

    const handleBack = () => {
        setStep(1);
    };

    const defaultPaperSx = {
        bgcolor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
    };

    const defaultBackdropSx = {
        backgroundColor: 'rgba(10, 12, 16, 0.45)',
        backdropFilter: 'blur(2px)',
    };


    return (
        <Modal
            open={openModal}
            onClose={handleClose}
            aria-labelledby="campaign-flow-modal"
            aria-describedby="choose-and-create-campaign"
            slotProps={{
                backdrop: {
                    sx: { ...defaultBackdropSx }
                }
            }}
            PaperProps={{
                sx: { ...defaultPaperSx },
            }}
        >
            <Box className={styles.modalBox}>
                <Box className={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {step === 2 && (
                            <IconButton onClick={handleBack} size="small" sx={{ ml: -1 }}>
                                <ChevronLeft size={24} />
                            </IconButton>
                        )}
                        <Typography className={styles.title} variant="h5">
                            {step === 1 ? 'Choose Campaign Type' : 'Create Template'}
                        </Typography>
                    </div>
                    <IconButton
                        onClick={handleClose}
                        className={styles.closeBtn}
                        size="small"
                    >
                        <X size={24} />
                    </IconButton>
                </Box>

                {step === 1 ? (
                    <>
                        <Box className={styles.optionsContainer}>
                            <Box
                                onClick={() => handleSelect('simple')}
                                className={`${styles.optionCard} ${selectedOption === 'simple' ? styles.selected : ''}`}
                            >
                                <div className={styles.iconWrapper}>
                                    <MessageSquare size={24} />
                                </div>
                                <Box className={styles.cardContent}>
                                    <div className={styles.cardHeader}>
                                        <Typography className={styles.cardTitle}>Simple Campaign</Typography>
                                    </div>
                                    <Typography className={styles.cardSubtitle}>
                                        Create a single message campaign template with text, images, or buttons
                                    </Typography>
                                </Box>
                            </Box>

                            <Box className={`${styles.optionCard} ${styles.disabled}`}>
                                <div className={styles.iconWrapper}>
                                    <Zap size={24} />
                                </div>
                                <Box className={styles.cardContent}>
                                    <div className={styles.cardHeader}>
                                        <Typography className={styles.cardTitle}>Automation Flow</Typography>
                                        <span className={styles.badge}>Coming soon</span>
                                    </div>
                                    <Typography className={styles.cardSubtitle}>
                                        Create an interactive flow with multiple steps and conditional branching
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box className={styles.actions}>
                            <Button variant="outlined" onClick={handleClose} className={styles.cancelBtn}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                disabled={!selectedOption}
                                onClick={handleContinue}
                                className={styles.continueBtn}
                                disableElevation
                            >
                                Continue
                            </Button>
                        </Box>
                    </>
                ) : (
                    <ComposedMessage1
                        message={message}
                        uploadedMedia={uploadedMedia}
                        setUploadedMedia={setUploadedMedia}
                        onMessageChange={onMessageChange}
                        onSave={(data) => {
                            if (onSave) onSave(data);
                            handleClose();
                        }}
                        templateData={templateData}
                    />
                )}
            </Box>
        </Modal>
    );
};

export default OptionModal1;
