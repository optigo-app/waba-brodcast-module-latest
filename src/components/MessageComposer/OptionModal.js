import React, { useState } from 'react';
import { X, MessageSquare, Zap } from 'lucide-react';
import { Box, Modal, Typography, Button } from '@mui/material';
import ComposedModal from './ComposedModal';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    maxHeight: '90vh',
    overflowY: 'auto',
    bgcolor: 'background.paper',
    border: 'none',
    borderRadius: '12px',
    boxShadow: 24,
    p: 4,
    '&::-webkit-scrollbar': {
        width: '4px',
    },
    '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
    },
    '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '4px',
    },
};

const optionCardStyle = (isSelected) => {
    const root = document.documentElement;
    const themeColor = getComputedStyle(root).getPropertyValue('--background-theme').trim() || '#8e4ff3';

    return {
        border: `2px solid ${isSelected ? themeColor : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: isSelected ? '#f0f7ff' : 'white',
        '&:hover': {
            borderColor: themeColor,
            backgroundColor: '#f8fafc',
        },
    };
};

const OptionModal = ({ openModal, setOpenModal, openModal1, setOpenModal1, message, uploadedMedia, setUploadedMedia, quillRef, handleFileUpload, onMessageChange, onSave }) => {
    const [selectedOption, setSelectedOption] = useState('simple');

    const handleSelect = (option) => {
        setSelectedOption(option);
    };

    const handleContinue = () => {
        if (selectedOption === 'automation') {
            window.open("https://chatbotbuilder1.netlify.app/", "_blank")
        } else if (selectedOption === 'simple') {
            setOpenModal1(true)
            setOpenModal(false);
            setSelectedOption('simple')
        }
    };

    const handleClose = () => {
        setOpenModal(false);
        setSelectedOption('simple');
    }

    return (
        <>
            <Modal
                open={openModal}
                onClose={handleClose}
                aria-labelledby="template-options-modal"
                aria-describedby="select-template-type"
            >
                <Box sx={style}>
                    <div className="flex justify-between items-center mb-6">
                        <Typography variant="h5" component="h2" className="font-semibold text-gray-800">
                            Choose Template Type
                        </Typography>
                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div
                            onClick={() => handleSelect('simple')}
                            style={optionCardStyle(selectedOption === 'simple')}
                            className="flex items-start"
                        >
                            <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                <MessageSquare className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Simple Template</h3>
                                <p className="text-sm text-gray-500">
                                    Create a single message template with text, images, or buttons
                                </p>
                            </div>
                        </div>

                        <div
                            onClick={() => handleSelect('automation')}
                            style={optionCardStyle(selectedOption === 'automation')}
                            className="flex items-start"
                        >
                            <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                <Zap className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 mb-1">Automation Flow</h3>
                                <p className="text-sm text-gray-500">
                                    Create an interactive flow with multiple steps and conditional branching
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Button
                            variant="outlined"
                            onClick={handleClose}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            disabled={!selectedOption}
                            onClick={handleContinue}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            Continue
                        </Button>
                    </div>
                </Box>
            </Modal>

            <ComposedModal
                openModal1={openModal1}
                setOpenModal1={setOpenModal1}
                message={message}
                uploadedMedia={uploadedMedia}
                setUploadedMedia={setUploadedMedia}
                quillRef={quillRef}
                handleFileUpload={handleFileUpload}
                onMessageChange={onMessageChange}
                onSave={onSave}
            />
        </>
    );
};

export default OptionModal;
