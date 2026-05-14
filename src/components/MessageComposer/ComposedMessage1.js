import React, { useState, useMemo } from "react";
import { TextField, Autocomplete, Button, Paper, Box, Typography } from "@mui/material";
import styles from "./ComposedMessage1.module.scss";

const ComposedMessage1 = ({ onSave, onMessageChange, templateData = {} }) => {
    const templateOptions = JSON.parse(sessionStorage.getItem("templateOptions")) || [];
    // Format template options for Autocomplete
    const formattedOptions = useMemo(() =>
        templateOptions
            .map(option => ({
                label: option.Name,
                type: option.Type,
                id: option.Id
            }))
            .sort((a, b) => a.type.localeCompare(b.type))
        , [templateOptions]);

    const [formData, setFormData] = useState({
        campaignName: templateData.campaignName || "",
        templateName: templateData.templateName || "",
        templateType: templateData.templateType || ""
    });

    const [tempCampaignName, setTempCampaignName] = useState(formData.campaignName);
    const [selectedTemplate, setSelectedTemplate] = useState(
        templateData.templateName
            ? {
                label: templateData.templateName,
                type: templateData.templateType,
                id: templateData.templateId
            }
            : null
    );

    const handleTemplateChange = (event, value) => {
        setSelectedTemplate(value);
        const updatedFormData = {
            ...formData,
            templateName: value?.label || "",
            templateType: value?.type || "Marketing",
            templateId: value?.id
        };
        setFormData(updatedFormData);
        if (onMessageChange) onMessageChange(updatedFormData);
    };

    const handleSave = () => {
        if (!formData.campaignName?.trim() || !formData.templateName?.trim()) {
            return;
        }
        if (onSave) onSave(formData);
    };

    return (
        <Box className={styles.composed_container}>
            <div className={styles.form_group}>
                <Typography className={styles.fieldLabel}>Campaign Name</Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="medium"
                    value={tempCampaignName}
                    onChange={(e) => {
                        const value = e.target.value;
                        setTempCampaignName(value);
                        const updatedFormData = { ...formData, campaignName: value };
                        setFormData(updatedFormData);
                        if (onMessageChange) onMessageChange(updatedFormData);
                    }}
                    placeholder="Enter campaign name..."
                    error={!formData.campaignName?.trim()}
                    helperText={
                        !formData.campaignName?.trim()
                            ? "Campaign name is required"
                            : ""
                    }
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#fcfcfd',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(90, 90, 90, 0.08)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(90, 90, 90, 0.2)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#7367f0',
                                borderWidth: 1,
                            }
                        }
                    }}
                />
            </div>

            <div className={styles.form_group}>
                <Typography className={styles.fieldLabel}>Select Template</Typography>
                <Autocomplete
                    options={formattedOptions}
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    getOptionLabel={(option) => option.label || ""}
                    groupBy={(option) => option.type}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            placeholder="Search or select a template..."
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: '#fcfcfd',
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(90, 90, 90, 0.08)',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(90, 90, 90, 0.2)',
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#7367f0',
                                        borderWidth: 1,
                                    }
                                }
                            }}
                        />
                    )}
                    renderGroup={(params) => (
                        <div key={params.key}>
                            <div className={styles.group_header}>
                                {params.group}
                            </div>
                            <div style={{ padding: '0 8px' }}>
                                {params.children}
                            </div>
                        </div>
                    )}
                    PaperComponent={({ children, ...other }) => (
                        <Paper
                            {...other}
                            sx={{
                                borderRadius: 2,
                                boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
                                mt: 0.5,
                                overflow: 'hidden',
                                '& .MuiAutocomplete-listbox': {
                                    padding: '8px'
                                },
                                '& .MuiAutocomplete-option': {
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    padding: '10px 12px',
                                    margin: '2px 0',
                                    transition: 'all 0.2s ease',
                                    '&[aria-selected="true"]': {
                                        backgroundColor: 'rgba(115, 103, 240, 0.08)',
                                        color: '#7367f0',
                                        fontWeight: 600
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(115, 103, 240, 0.04)'
                                    }
                                }
                            }}
                        >
                            {children}
                        </Paper>
                    )}
                />
            </div>

            <div className={styles.form_footer}>
                <Button
                    onClick={handleSave}
                    className={styles.save_btn}
                    disabled={
                        !formData.campaignName?.trim() ||
                        !formData.templateName?.trim()
                    }
                    disableElevation
                >
                    Save Template
                </Button>
            </div>
        </Box>
    );
};

export default ComposedMessage1;