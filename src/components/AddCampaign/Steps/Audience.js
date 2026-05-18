import React from 'react';
import { Box, Typography, Paper, Button, Chip, FormControl, InputLabel, Select, MenuItem, Dialog, IconButton } from '@mui/material';
import { Plus, Database, FileSpreadsheet, X } from 'lucide-react';
import AudienceGrid from '../../Audience/AudienceGrid';
import FilterSelectionDialog from '../../Audience/FilterSelectionDialog';
import styles from '../AddCampaign.module.scss';
import { ExcelImport } from '../../../API/InitialApi/UploadMedia';
import toast from 'react-hot-toast';
import { fetchExcelList } from '../../../API/ExcelLists/ExcelLists';
import { fetchCampaignDetails } from '../../../API/CampaignList/FetchCampaignDetails';
import { useAuthToken } from '../../../hooks/useAuthToken';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const AUDIENCE_SELECTION_DRAFT_KEY = 'audienceSelectionDraft';

const Audience = ({ onNext, onBack, onAudienceChange, onDataSourceChange, onFilterChange, showError, audienceError, customerFilters, audienceData, audienceGridData, isEditClone, campaignId, isRetargetFlow = false, retargetSourceCampaignName = '', retargetStatus = 'Overall', retargetStatusOptions = [], onRetargetStatusChange, retargetSourceCampaignId = null, retargetChatMsgStatus = null }) => {
    const [source, setSource] = useState('crm');
    const [file, setFile] = useState(null);
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [sourceSelectionOpen, setSourceSelectionOpen] = useState(false);
    const [filteredDataFromDialog, setFilteredDataFromDialog] = useState(null);
    const { userToken } = useAuthToken();
    const [filters, setFilters] = useState({
        companyName: null,
        companyType: null,
        state: null,
        city: null,
        country: null,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });
    const [selectedRowMap, setSelectedRowMap] = useState({});
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const hasLoadedCustomersRef = useRef(false);

    const searchTimeoutRef = useRef(null);

    // Fetch audience data for retarget flow
    useEffect(() => {
        const fetchRetargetAudience = async () => {
            if (isRetargetFlow && retargetSourceCampaignId && !hasLoadedCustomersRef.current) {
                try {
                    toast.loading('Loading audience data...', { id: 'retarget-audience' });
                    const detailsResult = await fetchCampaignDetails(userToken?.userId, retargetSourceCampaignId, retargetChatMsgStatus);

                    if (detailsResult.success && detailsResult.data?.rd2) {
                        const apiAudience = detailsResult.data.rd2;

                        if (apiAudience.length > 0) {
                            const mappedAudience = apiAudience.map((item) => ({
                                CustomerId: item.CustomerId || item.MessageId || '',
                                CustomerCode: item.CustomerCode || item.CustomerId || '',
                                CustomerName: item.CustomerName || item.FirstName || '',
                                CompanyType: item.CompanyType || item.Company || '',
                                CustomerEmail: item.CustomerEmail || item.Email || '',
                                CustomerPhone: item.CustomerPhone || item.PhoneNo || '',
                                PhoneNo: item.PhoneNo || item.CustomerPhone || '',
                                Email: item.Email || item.CustomerEmail || '',
                                Country: item.Country || '',
                                State: item.State || '',
                                City: item.City || '',
                                Company: item.Company || item.CompanyType || '',
                                CustomerType: item.CustomerType || '',
                                Category: item.Category || '',
                                FirstName: item.FirstName || '',
                                LastName: item.LastName || '',
                                Source: item.DataSource || 'optigo'
                            }));

                            const source = mappedAudience[0]?.Source || 'optigo';
                            setSource(source === 'optigo' ? 'crm' : 'excel');
                            onDataSourceChange(source === 'optigo' ? 'crm' : 'excel');

                            setFilteredDataFromDialog(mappedAudience);
                            const selectedIds = mappedAudience.map(row => row.CustomerId || row.MessageId || row.id);
                            setRowSelectionModel({ type: 'include', ids: new Set(selectedIds) });

                            const rowMap = {};
                            mappedAudience.forEach(row => {
                                const rowId = row.CustomerId || row.MessageId || row.id;
                                if (rowId) {
                                    rowMap[rowId] = row;
                                }
                            });
                            setSelectedRowMap(rowMap);

                            onAudienceChange(mappedAudience);
                        } else {
                            toast.error('No audience found for the selected status');
                        }
                    } else {
                        toast.error('Failed to load audience data');
                    }
                } catch (error) {
                    console.error('Error fetching retarget audience:', error);
                    toast.error('Error loading audience data');
                } finally {
                    toast.dismiss('retarget-audience');
                    hasLoadedCustomersRef.current = true;
                }
            }
        };

        fetchRetargetAudience();
    }, [isRetargetFlow, retargetSourceCampaignId, retargetChatMsgStatus, userToken?.userId, onDataSourceChange, onAudienceChange]);

    // Handle audience data when editing/cloning
    useEffect(() => {
        if (!hasLoadedCustomersRef.current && !isRetargetFlow) {
            if (isEditClone && audienceGridData && audienceGridData.length > 0) {
                const source = audienceGridData[0]?.Source || 'optigo';
                setSource(source === 'optigo' ? 'crm' : 'excel');
                onDataSourceChange(source === 'optigo' ? 'crm' : 'excel');

                setFilteredDataFromDialog(audienceGridData);
                const selectedIds = audienceGridData.map(row => row.CustomerId || row.id);
                setRowSelectionModel({ type: 'include', ids: new Set(selectedIds) });

                const rowMap = {};
                audienceGridData.forEach(row => {
                    const rowId = row.CustomerId || row.id;
                    if (rowId) {
                        rowMap[rowId] = row;
                    }
                });
                setSelectedRowMap(rowMap);

                if (customerFilters) {
                    setSelectedGroup(customerFilters.selectedGroup || null);
                    setSelectedBranches(customerFilters.selectedBranches || []);
                    setFilters(customerFilters.filters || {
                        companyName: null,
                        companyType: null,
                        state: null,
                        city: null,
                        country: null,
                    });
                    setSearchTerm(customerFilters.searchTerm || '');
                }

                hasLoadedCustomersRef.current = true;
            }
        }
    }, [isEditClone, isRetargetFlow, audienceData, audienceGridData, customerFilters, onDataSourceChange]);

    const debounceSearch = (value) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(value);
        }, 200);
    };

    const [excelData, setExcelData] = useState({
        rows: [],
        loading: true
    });

    const fetchCampignId = campaignId || JSON.parse(sessionStorage.getItem("campaignStepperState"))?.selectedTemplates[0]?.campaignId;

    const saveAudienceDraft = useCallback((rows, selectedIdsList, currentSource, currentFile) => {
        const safeRows = Array.isArray(rows) ? rows : [];
        const safeSelectedIds = Array.isArray(selectedIdsList) ? selectedIdsList : [];

        sessionStorage.setItem(AUDIENCE_SELECTION_DRAFT_KEY, JSON.stringify({
            source: currentSource,
            rows: safeRows,
            selectedIds: safeSelectedIds,
            fileName: currentFile?.name || '',
            fileSize: currentFile?.size || 0,
        }));
    }, []);

    useEffect(() => {
        const rawDraft = sessionStorage.getItem(AUDIENCE_SELECTION_DRAFT_KEY);
        if (!rawDraft) return;

        try {
            const draft = JSON.parse(rawDraft);
            const draftRows = Array.isArray(draft?.rows) ? draft.rows : [];
            const draftSelectedIds = Array.isArray(draft?.selectedIds)
                ? draft.selectedIds
                : draftRows.map((row) => row?.CustomerId || row?.id).filter(Boolean);

            if (draft?.source) {
                setSource(draft.source);
            }

            if (draftRows.length > 0) {
                setFilteredDataFromDialog(draftRows);
                setRowSelectionModel({ type: 'include', ids: new Set(draftSelectedIds) });

                const draftRowMap = {};
                draftRows.forEach((row) => {
                    const rowId = row?.CustomerId || row?.id;
                    if (rowId !== undefined && rowId !== null) {
                        draftRowMap[rowId] = row;
                    }
                });
                setSelectedRowMap(draftRowMap);
            }

            if (draft?.fileName) {
                setFile({ name: draft.fileName, size: draft.fileSize || 0 });
            }
        } catch (error) {
            console.error('Error restoring audience draft:', error);
        }
    }, []);

    const selectedIds = useMemo(() => {
        if (rowSelectionModel?.ids instanceof Set) {
            return Array.from(rowSelectionModel.ids);
        }
        return [];
    }, [rowSelectionModel]);

    const rowSelectionData = useMemo(() => {
        return selectedIds
            .map((id) => selectedRowMap[id])
            .filter(Boolean);
    }, [selectedIds, selectedRowMap]);

    const handleApplyFilters = (newFilters) => {
        setFilters({
            companyName: newFilters.companyName?.companyname || null,
            companyType: newFilters.companyType?.businessclassname || null,
            state: newFilters.state?.StateName || null,
            city: newFilters.city?.City || null,
            country: newFilters.country?.CountryName || null,
        });
    };

    const fetchExcelData = async (campaignId) => {
        try {
            setExcelData(prev => ({ ...prev, loading: true }));
            const result = await fetchExcelList(userToken?.userId, campaignId, "", filters, searchTerm);

            if (result) {
                setExcelData({
                    rows: result.data || [],
                    loading: false
                });
            }
        } catch (error) {
            console.error('Error fetching Excel data:', error);
            setExcelData({
                rows: [],
                loading: false
            });
        }
    };

    const handleNext = () => {
        const audience = rowSelectionData.map(item => {
            let phone = (item.CustomerPhone || item.PhoneNo || item.phone || '').replace(/\D/g, '');

            if (phone.length === 10) {
                phone = '91' + phone;
            }

            return {
                customerId: item.CustomerId,
                phone: phone
            };
        });

        const selectedIdsToPersist = rowSelectionData
            .map((row) => row?.CustomerId || row?.id)
            .filter((id) => id !== undefined && id !== null);
        saveAudienceDraft(rowSelectionData, selectedIdsToPersist, source, file);

        if (onAudienceChange) {
            onAudienceChange(audience);
        }
        if (onDataSourceChange) {
            onDataSourceChange(source === "crm" ? "optigo" : "excel");
        }
        onNext();
    };

    const handleGridSearchChange = useCallback((value) => {
        setSearchInput(value);
        debounceSearch(value);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFileUploadForDialog = useCallback(async (uploadedFile) => {
        if (!uploadedFile) {
            setFile(null);
            return;
        }
        setFile(uploadedFile);
        const fileUpload = await ExcelImport(uploadedFile, userToken?.userId, fetchCampignId);
        if (fileUpload?.success) {
            toast.success(fileUpload?.message || 'File uploaded successfully');
            await fetchExcelData(fetchCampignId);
        } else {
            toast.error(fileUpload?.message || 'Failed to upload file');
        }
    }, [userToken?.userId, fetchCampignId]); // eslint-disable-line react-hooks/exhaustive-deps

    const isNextDisabled = rowSelectionData.length === 0;

    const toggleFilterDialog = useCallback(() => {
        setFilterDialogOpen(prev => !prev);
    }, []);

    const openSourceSelectionDialog = useCallback(() => {
        setSourceSelectionOpen(true);
    }, []);

    const closeSourceSelectionDialog = useCallback(() => {
        setSourceSelectionOpen(false);
    }, []);

    const handleSourceSelection = useCallback((selectedSource) => {
        setSource(selectedSource);
        setSourceSelectionOpen(false);
        setFilterDialogOpen(true);
    }, []);

    const handleFilterContinue = (data) => {
        if (data?.source && data.source !== source) {
            setSource(data.source);
        }

        setFilters(data.filters);
        setSearchTerm(data.searchTerm);
        setSelectedBranches(data.selectedBranches || []);
        setSelectedGroup(data.selectedGroup || null);

        // Pass filter data to parent
        if (onFilterChange) {
            onFilterChange({
                filters: data.filters,
                searchTerm: data.searchTerm,
                selectedBranches: data.selectedBranches || [],
                selectedGroup: data.selectedGroup || null,
            });
        }

        const selectedIds = Array.isArray(data.selectedIds) ? data.selectedIds : [];

        const selectedRows = (data.gridData || []).filter(row => {
            const rowId = row.CustomerId || row.id;
            return selectedIds.includes(rowId);
        });

        if (data.mode === 'replace') {
            setFilteredDataFromDialog(selectedRows);
            setRowSelectionModel({ type: 'include', ids: new Set(selectedIds) });

            const newSelectedRowMap = {};
            selectedRows.forEach(row => {
                const rowId = row.CustomerId || row.id;
                newSelectedRowMap[rowId] = row;
            });
            setSelectedRowMap(newSelectedRowMap);
            saveAudienceDraft(selectedRows, selectedIds, source, file);
        } else {
            const existingData = filteredDataFromDialog || [];
            const combinedData = [...existingData];
            selectedRows.forEach(newRow => {
                const rowId = newRow.CustomerId || newRow.id;
                if (!combinedData.some(row => (row.CustomerId || row.id) === rowId)) {
                    combinedData.push(newRow);
                }
            });

            setFilteredDataFromDialog(combinedData);

            const allIds = combinedData.map(row => row.CustomerId || row.id);
            setRowSelectionModel({ type: 'include', ids: new Set(allIds) });

            const newSelectedRowMap = { ...selectedRowMap };
            selectedRows.forEach(row => {
                const rowId = row.CustomerId || row.id;
                newSelectedRowMap[rowId] = row;
            });
            setSelectedRowMap(newSelectedRowMap);
            saveAudienceDraft(combinedData, allIds, source, file);
        }

        setFilterDialogOpen(false);
    };

    const handleRowSelectionModelChange = useCallback((model) => {
        setRowSelectionModel(model);
        onAudienceChange(model);
        // Clear error when audience is selected
        if (model.length > 0) {
            // The parent component should handle clearing the error
        }
    }, [onAudienceChange]);

    const processDroppedExcelFile = async (excelFile) => {
        if (!excelFile) return;

        const fileExt = excelFile.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['xlsx', 'xls', 'csv'];

        if (!allowedExtensions.includes(fileExt)) {
            alert('Please upload only Excel (.xlsx, .xls) or CSV files');
            return;
        }

        if (excelFile.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit');
            return;
        }

        if (!fetchCampignId) {
            toast.error('Please select a campaign first');
            return;
        }

        setSource('excel');
        setFile(excelFile);
        setFilterDialogOpen(true);
        setIsDragging(false);

        const fileUpload = await ExcelImport(excelFile, userToken?.userId, fetchCampignId);
        if (fileUpload?.success) {
            toast.success(fileUpload?.message || 'File uploaded successfully');
            await fetchExcelData(fetchCampignId);
        } else {
            toast.error(fileUpload?.message || 'Failed to upload file');
        }
    };

    const handleGlobalDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer?.types?.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleGlobalDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragging(false);
        }
    };

    const handleGlobalDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    return (
        <div className={styles.formCard}>
            <div
                className={styles.audienceContainer}
                onDragOver={handleGlobalDragOver}
                onDragLeave={handleGlobalDragLeave}
                onDrop={handleGlobalDrop}
            >
                {isDragging && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 1300,
                            backgroundColor: 'rgba(10, 20, 30, 0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px',
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(false);
                        }}
                    >
                        <Box
                            sx={{
                                width: 'min(680px, 90vw)',
                                minHeight: 260,
                                border: '3px dashed #ffffff',
                                borderRadius: 4,
                                px: 6,
                                py: 5,
                                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                                backdropFilter: 'blur(4px)',
                                textAlign: 'center',
                                color: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onDrop={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const files = Array.from(e.dataTransfer.files || []);
                                await processDroppedExcelFile(files[0]);
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                Drop Excel/CSV file here
                            </Typography>
                            <Typography variant="body1" sx={{ opacity: 0.95 }}>
                                Drop inside this box to upload
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>
                                Supported: .xlsx, .xls, .csv (Max 10MB)
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Box className={styles.gridBox}>
                    <Box className={styles.gridHeader} sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                            <Typography className={styles.gridTitle}>
                                {source === 'crm' ? 'CRM Contacts' : 'Imported Contacts'}
                            </Typography>
                            {source === 'excel' && file && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    ({file.name})
                                </Typography>
                            )}
                            {source === 'excel' && file && (
                                <Typography variant="caption" sx={{ color: 'var(--secondary-color)' }}>
                                    Total: {excelData?.rows?.length || 0}
                                </Typography>
                            )}
                            <Typography sx={{ color: 'var(--secondary-color)', fontSize: '0.875rem' }}>
                                Selected: {selectedIds.length} {selectedIds.length === 1 ? 'row' : 'rows'}
                            </Typography>
                            {selectedBranches.length > 0 && (
                                <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {selectedBranches.slice(0, 3).map((branch) => (
                                        <Chip
                                            key={branch.Number}
                                            label={branch.UFCC}
                                            size="small"
                                        />
                                    ))}
                                    {selectedBranches.length > 3 && (
                                        <Chip
                                            label={`+${selectedBranches.length - 3} more`}
                                            size="small"
                                        />
                                    )}
                                </Box>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* {isRetargetFlow && (
                                <FormControl size="small" sx={{ minWidth: 170 }}>
                                    <InputLabel id="retarget-status-label">Retarget Status</InputLabel>
                                    <Select
                                        labelId="retarget-status-label"
                                        value={retargetStatus || 'Overall'}
                                        label="Retarget Status"
                                        onChange={(e) => onRetargetStatusChange?.(e.target.value)}
                                    >
                                        {retargetStatusOptions.map((statusOption) => (
                                            <MenuItem key={statusOption} value={statusOption}>{statusOption}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )} */}
                            <Button
                                variant='contained'
                                className='buttonClassname'
                                size="small"
                                startIcon={<Plus />}
                                onClick={openSourceSelectionDialog}
                            >
                                Add Audience
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
                        {filteredDataFromDialog && filteredDataFromDialog.length > 0 ? (
                            <AudienceGrid
                                rows={filteredDataFromDialog}
                                onRowSelectionModelChange={handleRowSelectionModelChange}
                                rowSelectionModel={rowSelectionModel}
                                onFilterClick={toggleFilterDialog}
                                source={source}
                                loading={false}
                                searchText={searchInput}
                                onSearchChange={handleGridSearchChange}
                            />
                        ) : (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '97%',
                                    minHeight: 300,
                                    border: '2px dashed var(--sidebar-borderColor)',
                                    borderRadius: '12px',
                                    backgroundColor: '#fcfcfd'
                                }}
                            >
                                <Typography variant="h6" sx={{ color: 'var(--secondary-color)', mb: 2 }}>
                                    {source === 'excel' && file ? 'Excel uploaded successfully' : 'No contacts selected'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'var(--secondary-color)', mb: 3 }}>
                                    {source === 'crm'
                                        ? 'Click Add to filter and select contacts from CRM'
                                        : file
                                            ? `Excel has ${excelData?.rows?.length || 0} contacts. Click Filter Audience to select contacts.`
                                            : 'Upload Excel file to filter contacts'}
                                </Typography>
                                <Button
                                    variant='contained'
                                    className='buttonClassname'
                                    startIcon={<Plus />}
                                    onClick={openSourceSelectionDialog}
                                >
                                    {source === 'crm' ? 'Add Audience' : file ? 'Filter Audience' : 'Upload Excel'}
                                </Button>
                            </Box>
                        )}

                        {audienceError && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#fee2e2', borderRadius: '8px', border: '1px solid #ef4444' }}>
                                <Typography sx={{ color: '#dc2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Audience selection is required. Please add audience members before proceeding.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                <FilterSelectionDialog
                    open={filterDialogOpen}
                    onClose={toggleFilterDialog}
                    onContinue={handleFilterContinue}
                    filters={filters}
                    onFilterChange={handleApplyFilters}
                    userToken={userToken}
                    source={source}
                    excelData={excelData}
                    onFileUpload={handleFileUploadForDialog}
                    uploadedFile={file}
                    preSelectedData={filteredDataFromDialog}
                    preSelectedBranches={selectedBranches}
                    preSelectedGroup={selectedGroup}
                />

                <Dialog
                    open={sourceSelectionOpen}
                    onClose={closeSourceSelectionDialog}
                    fullWidth
                    keepMounted
                    maxWidth="md"
                    PaperProps={{ className: styles.sourceSelectionDialogPaper }}
                >
                    <Box className={styles.sourceSelectionDialogBody}>
                        <Typography className={styles.sourceSelectionTitle}>
                            Choose import source
                        </Typography>
                        <Typography className={styles.sourceSelectionSubtitle}>
                            Select where you want to import audience contacts from.
                        </Typography>
                        <IconButton
                            onClick={closeSourceSelectionDialog}
                            sx={{ position: 'absolute', top: 16, right: 16, '&:hover': { backgroundColor: '#f5f5f5', color: '#ff2727' } }}
                        >
                            <X size={20} />
                        </IconButton>

                        <Box className={styles.sourceCardGrid}>
                            <Box
                                className={`${styles.sourceCard} ${styles.crmSourceCard}`}
                                onClick={() => handleSourceSelection('crm')}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleSourceSelection('crm');
                                    }
                                }}
                            >
                                <Box className={styles.sourceIconWrap}>
                                    <Database size={22} />
                                </Box>
                                <Typography className={styles.sourceCardTitle}>Import from CRM</Typography>
                                <Typography className={styles.sourceCardDesc}>
                                    Use your CRM customer contacts and filter by group, branch, and profile data.
                                </Typography>
                            </Box>

                            <Box
                                className={`${styles.sourceCard} ${styles.excelSourceCard}`}
                                onClick={() => handleSourceSelection('excel')}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleSourceSelection('excel');
                                    }
                                }}
                            >
                                <Box className={styles.sourceIconWrap}>
                                    <FileSpreadsheet size={22} />
                                </Box>
                                <Typography className={styles.sourceCardTitle}>Import from Excel / CSV</Typography>
                                <Typography className={styles.sourceCardDesc}>
                                    Upload and use audience contacts from your spreadsheet file.
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Dialog>
            </div>

            {/* Action Buttons */}
            <div className={styles.formActions}>
                <Button className='varientOutlinedBtn' onClick={onBack}>
                    Back
                </Button>
                <Button className='buttonClassname' onClick={handleNext} disabled={isNextDisabled}>
                    Next
                </Button>
            </div>
        </div>
    );
};

export default Audience;
