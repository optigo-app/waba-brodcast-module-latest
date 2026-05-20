import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

const TemplateDetailsStepSection = ({
    styles,
    templateDetails,
    templateNameError,
    categoryCards,
    onTemplateNameChange,
    onTemplateLanguageChange,
    onTemplateCategoryChange,
    isCategoryLocked = false,
    onClose,
    onNext,
}) => {
    return (
        <Box className={styles.stepPanel}>
            <div className={styles.inputSection}>
                <Typography className={styles.fieldLabel}>Template Name</Typography>
                <TextField
                    fullWidth
                    placeholder="e.g. summer_sale_offer"
                    value={templateDetails.templateName}
                    onChange={(e) => onTemplateNameChange(e.target.value)}
                    error={Boolean(templateNameError)}
                    helperText={templateNameError}
                />
            </div>

            <div className={styles.inputSection}>
                <Typography className={styles.fieldLabel}>Template Language</Typography>
                <TextField
                    select
                    fullWidth
                    value={templateDetails.templateLanguage}
                    onChange={(e) => onTemplateLanguageChange(e.target.value)}
                    SelectProps={{ native: true }}
                >
                    <option value="en">English</option>
                    <option value="en_US">English (US)</option>
                    <option value="en_GB">English (UK)</option>
                    <option value="hi">Hindi</option>
                    <option value="ar">Arabic</option>
                    <option value="es">Spanish</option>
                    <option value="pt_BR">Portuguese (BR)</option>
                </TextField>
            </div>

            <div className={styles.inputSection}>
                <Typography className={styles.fieldLabel}>Template Category</Typography>
                <Typography
                    sx={{
                        fontSize: '0.78rem',
                        color: '#b45309',
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        marginBottom: '10px',
                        lineHeight: 1.45,
                    }}
                >
                    Info: Image and Carousel templates should use the Marketing category.
                </Typography>
                <div className={styles.categoryList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {categoryCards.map((card) => {
                        const { Icon } = card;
                        const isSelected = templateDetails.templateCategory === card.key;
                        return (
                            <button
                                key={card.key}
                                type="button"
                                className={`${styles.categoryCardFull} ${isSelected ? styles.selectedCategoryFull : ''}`}
                                disabled={isCategoryLocked}
                                onClick={() => onTemplateCategoryChange(card.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    backgroundColor: isSelected ? 'rgba(115, 103, 240, 0.06)' : '#ffffff',
                                    cursor: isCategoryLocked ? 'not-allowed' : 'pointer',
                                    opacity: isCategoryLocked ? 0.75 : 1,
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                    width: '100%',
                                    borderColor: isSelected ? '#7367f0' : '#e2e8f0'
                                }}
                            >
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: isSelected ? 'rgba(115, 103, 240, 0.16)' : '#f1f5f9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isSelected ? '#7367f0' : 'var(--secondary-color)'
                                    }}
                                >
                                    <Icon size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>{card.key}</Typography>
                                    <Typography sx={{ color: 'var(--secondary-color)', fontSize: '0.875rem' }}>{card.description}</Typography>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className={styles.stepFooter}>
                <Button variant="outlined" onClick={onClose} className={styles.cancelBtn}>
                    Cancel
                </Button>
                <Button variant="contained" className="buttonClassname" onClick={onNext}>
                    Next
                </Button>
            </div>
        </Box>
    );
};

export default TemplateDetailsStepSection;
