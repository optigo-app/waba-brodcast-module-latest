
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button, Box, Typography, CircularProgress, Paper, IconButton } from '@mui/material';
import * as XLSX from 'xlsx';
import { FileText, Upload, X } from 'lucide-react';
import StepperNavigation from "../NavigationStepper/StepperNavigation";
import AudienceSourceSelector from './AudienceSourceSelector';
import GroupDropdown from './GroupDropdown';
import AudienceGrid from './AudienceGrid';
import FilterDrawer from './FilterDrawer';
import styles from './AudienceSection.module.scss';
import { fetchCustomerList } from '../../API/CustomerList/CustomerList';
import { fetchGroupFilterList } from '../../API/GroupFIlterData/GroupFilterData';
import { ExcelImport } from '../../API/InitialApi/UploadMedia';
import toast from 'react-hot-toast';
import { fetchExcelList } from '../../API/ExcelLists/ExcelLists';
import { useAuthToken } from '../../hooks/useAuthToken';

// Utility to parse Excel/CSV file
const parseFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (jsonData.length < 2) {
                    resolve([]);
                    return;
                }

                const headers = jsonData[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
                const rows = [];

                for (let i = 1; i < jsonData.length; i++) {
                    const row = {};
                    for (let j = 0; j < headers.length; j++) {
                        row[headers[j]] = jsonData[i][j] || '';
                    }
                    if (Object.values(row).some(val => val)) {
                        rows.push({
                            id: i,
                            ...row,
                            status: 'Imported'
                        });
                    }
                }

                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

const AudienceSection = ({ audience, onAudienceChange, onDataSourceChange, onNext, onPrevious, currentStep, steps }) => {
    // State for source selection (CRM or Excel)
    const [source, setSource] = useState('crm');
    const [selectedGroup, setSelectedGroup] = useState(null);
    console.log("TCL: AudienceSection -> selectedGroup", selectedGroup)
    const [GroupData, setGroupData] = useState([]);
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const { userToken } = useAuthToken();
    const [paginationModel, setPaginationModel] = useState({
        page: 0, // 0-based index for MUI DataGrid
        pageSize: 20,
    });
    const [rowCount, setRowCount] = useState(0);
    const [filters, setFilters] = useState({
        companyName: null,
        companyType: null,
        state: null,
        city: null,
        country: null,
    });
    console.log("TCL: AudienceSection -> filters", filters)

    // Check if any filter is active
    const isAnyFilterActive = useMemo(() => {
        return Object.values(filters).some(filter => filter !== null);
    }, [filters]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [groupSearchTerm, setGroupSearchTerm] = useState('');
    const [rowSelectionModel, setRowSelectionModel] = useState([]);

    // Create a ref to store the timeout ID
    const searchTimeoutRef = useRef(null);

    // Debounce search function
    const debounceSearch = (value) => {
        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set a new timeout
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(value);
            // Only reset pagination if not using client-side filtering
            if (!selectedGroup?.id) {
                setPaginationModel(prev => ({ ...prev, page: 0 }));
            }
        }, 500); // 500ms delay
    };

    // Debounce search function
    const debounceSearchGroup = (value) => {
        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set a new timeout
        searchTimeoutRef.current = setTimeout(() => {
            setSearchTerm(value);
            // Only reset pagination if not using client-side filtering
            if (!selectedGroup?.id) {
                setPaginationModel(prev => ({ ...prev, page: 0 }));
            }
        }, 20);
    };

    const [rowSelectionData, setRowSelectionData] = useState([]);
    const [tableData, setTableData] = useState({
        rows: [],
        loading: true
    });
    const [excelData, setExcelData] = useState({
        rows: [],
        loading: true
    });

    const fetchCampignId = JSON.parse(sessionStorage.getItem("campaignStepperState"))?.selectedTemplates[0]?.campaignId;

    // Filter rows based on search term
    const filteredRows = useMemo(() => {
        if (!searchTerm || !selectedGroup?.id) {
            return null; // Return null to indicate no client-side filtering needed
        }

        const searchLower = searchTerm.toLowerCase();
        return tableData.rows.filter(row => {
            // Search in all relevant fields
            return (
                (row.CustomerName?.toLowerCase().includes(searchLower)) ||
                (row.CustomerEmail?.toLowerCase().includes(searchLower)) ||
                (row.CustomerPhone?.toLowerCase().includes(searchLower)) ||
                (row.Country?.toLowerCase().includes(searchLower)) ||
                (row.City?.toLowerCase().includes(searchLower)) ||
                (row.State?.toLowerCase().includes(searchLower)) ||
                (row.CustomerCode?.toLowerCase().includes(searchLower)) ||
                (row.CompanyType?.toLowerCase().includes(searchLower))
            );
        });
    }, [searchTerm, tableData.rows, selectedGroup]);

    // Fetch data from server with pagination
    const fetchData = useCallback(async () => {
        try {
            if (source !== 'crm') return;

            // Skip API call if we have a selected group and we're just doing client-side search
            if (selectedGroup?.id && searchTerm) {
                return;
            }

            setTableData(prev => ({ ...prev, loading: true }));
            let result;

            if (selectedGroup?.id) {
                // For filtered group list
                result = await fetchGroupFilterList(
                    userToken?.userId,
                    selectedGroup.WhereClause || '',
                );
            } else {
                // For customer list
                // Only include filters that have values
                const { companyName, companyType, state, city, country } = filters;
                result = await fetchCustomerList(
                    userToken?.userId,
                    companyName || '',
                    companyType || '',
                    state || '',
                    city || '',
                    country || '',
                    groupSearchTerm || ''
                );
            }

            if (result) {
                setTableData({
                    rows: result.data || [],
                    loading: false
                });
                // Make sure to use the total count from the API response
                setRowCount(Number(result.total) || 0);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setTableData({
                rows: [],
                loading: false
            });
            setRowCount(0);
        }
    }, [source, paginationModel, selectedGroup, filters, userToken, groupSearchTerm, searchTerm]);

    // Fetch data when source, pagination, or filters change
    useEffect(() => {

        if (source === 'excel' && fetchCampignId) {
            fetchExcelData(fetchCampignId);
        } else if (source === 'crm') {
            fetchData();
        } else {
            // For other sources, reset the data
            setTableData({
                rows: [],
                loading: false
            });
            setRowCount(0);
        }
    }, [source, selectedGroup, fetchCampignId, groupSearchTerm, filters]);

    const handleGroupChange = (group) => {
        setSelectedGroup(group);
        setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset to first page when group changes
    };

    // Handle file upload
    const handleFileUpload = async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsLoading(true);

        try {
            if (!fetchCampignId) {
                toast.error('Please select a campaign first');
                return;
            }

            const data = await parseFile(selectedFile);
            const fileUpload = await ExcelImport(selectedFile, userToken?.userId, fetchCampignId);
            console.log("TCL: handleFileUpload -> fileUpload", fileUpload)

            if (fileUpload?.success) {
                toast.success(fileUpload?.message);
                setGroupData(fileUpload?.totalRows?.rd)
                // Use the new fetchExcelData function
                await fetchExcelData(fetchCampignId);
            } else {
                toast.error(fileUpload?.message || 'Failed to upload file');
            }
            setRowSelectionModel([]);
        } catch (error) {
            console.error('Error parsing file:', error);
            toast.error('Error processing file');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle filter changes
    const handleApplyFilters = (newFilters) => {
        setFilters({
            companyName: newFilters.companyName?.companyname || null,
            companyType: newFilters.companyType?.businessclassname || null,
            state: newFilters.state?.StateName || null,
            city: newFilters.city?.City || null,
            country: newFilters.country?.CountryName || null,
        });
        // Reset to first page when filters change
        setPaginationModel(prev => ({ ...prev, page: 0 }));
    };

    // Handle pagination model change - triggers new data fetch
    const handlePaginationModelChange = (newPaginationModel) => {
        setPaginationModel({
            page: newPaginationModel.page,
            pageSize: newPaginationModel.pageSize
        });
        // The useEffect with paginationModel as dependency will trigger a new data fetch

        // If the source is Excel, fetch the new page of data
        if (source === 'excel' && fetchCampignId) {
            fetchExcelData(fetchCampignId);
        }
    };

    // Fetch Excel data with pagination
    const fetchExcelData = async (campaignId) => {
        try {
            setExcelData(prev => ({ ...prev, loading: true }));
            const result = await fetchExcelList(userToken?.userId, campaignId, selectedGroup?.Category || "", filters, groupSearchTerm);

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
            setRowCount(0);
        }
    };

    // Handle next button click
    const handleNext = () => {
        // Get the selected audience data
        const selectedAudience = source === 'crm'
            ? tableData.rows.filter(item => rowSelectionModel.includes(item.id))
            : excelData.rows.filter(item => rowSelectionModel.includes(item.id));

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

        onAudienceChange(audience);
        onDataSourceChange(source === "crm" ? "optigo" : "excel");
        onNext();
    };

    // Check if next button should be enabled
    const isNextDisabled = rowSelectionData.length === 0;

    // Toggle filter drawer
    const toggleFilterDrawer = () => {
        setFilterDrawerOpen(!filterDrawerOpen);
    };

    // Handle row selection change
    const handleRowSelectionModelChange = (newRowSelectionModel) => {
        setRowSelectionModel(newRowSelectionModel);
    };

    // Handle source change
    const handleSourceChange = (newSource) => {
        setSource(newSource);
        setRowSelectionModel([]);
    };

    // Handle file input change
    const handleFileChange = (event) => {
        handleFileUpload(event);
    };

    // Handle file removal
    const handleRemoveFile = () => {
        setFile(null);
        setTableData({
            rows: [],
            loading: false
        });
        setRowCount(0);
        setRowSelectionModel([]);
    };

    return (
        <>
            <div className="home_main_section">
                <div className="step-card">
                    <div className="step-header">
                        <div className="step-icon">
                            <span>{currentStep}</span>
                        </div>
                        <h2 className="title">Select Audience</h2>
                    </div>
                </div>

                <Paper elevation={0} className={styles.content}>
                    {/* Source Selection */}
                    <AudienceSourceSelector
                        source={source}
                        onSourceChange={handleSourceChange}
                        searchTerm={searchTerm}
                        searchInput={searchInput}
                        onSearchChange={(value) => {
                            setSearchInput(value);
                            debounceSearch(value);
                        }}
                    />

                    {/* Group and Filter Selection */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px" }}>
                        <GroupDropdown
                            GroupData={GroupData}
                            selectedGroup={selectedGroup}
                            onGroupChange={(group) => {
                                setSelectedGroup(group);
                                handleGroupChange(group);
                            }}
                            source={source}
                            setFilterDrawerOpen={setFilterDrawerOpen}
                            currentStep={currentStep}
                            onSearchChange={(text) => {
                                setGroupSearchTerm(text);
                                debounceSearchGroup(text);
                                // Reset to first page when searching
                                setPaginationModel(prev => ({ ...prev, page: 0 }));
                            }}
                            isDisabled={isAnyFilterActive}
                            onCreateNewGroup={() => console.log("Create group modal open")}
                        />
                    </Box>
                    {/* )} */}

                    {/* File Upload (for Excel) */}
                    {source === 'excel' && (
                        <Box
                            className={`${styles.uploadArea} ${isDragging ? styles.dragActive : ''}`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragging(false);
                            }}
                            onDrop={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDragging(false);

                                const files = Array.from(e.dataTransfer.files);
                                if (files.length > 0) {
                                    const excelFile = files[0];
                                    const fileExt = excelFile.name.split('.').pop().toLowerCase();
                                    const allowedExtensions = ['xlsx', 'xls', 'csv'];

                                    if (allowedExtensions.includes(fileExt)) {
                                        if (excelFile.size <= 10 * 1024 * 1024) { // 10MB limit
                                            await handleFileUpload({ target: { files: [excelFile] } });
                                        } else {
                                            alert('File size exceeds 10MB limit');
                                        }
                                    } else {
                                        alert('Please upload only Excel (.xlsx, .xls) or CSV files');
                                    }
                                }
                            }}
                        >
                            {!file ? (
                                <label htmlFor="file-upload" className={styles.uploadLabel}>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <Upload size={48} className={styles.uploadIcon} />
                                    <Typography variant="h6" gutterBottom>
                                        {isDragging ? 'Drop the file here' : 'Drag & drop your Excel/CSV file here'}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" paragraph>
                                        or <span className={styles.browseLink}>browse</span> to choose a file
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Supported formats: .xlsx, .xls, .csv (Max 10MB)
                                    </Typography>
                                </label>
                            ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: "column", gap: "10px", justifyContent: 'space-between', mt: 2 }}>
                                    <FileText size={32} />
                                    <Box ml={2} flexGrow={1}>
                                        <Typography variant="subtitle1">{file.name}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {/* {(file.size / 1024 / 1024).toFixed(2)} MB • {tableData.rows.length} records found */}
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </Typography>
                                    </Box>
                                    <IconButton onClick={handleRemoveFile} size="small">
                                        <X size={20} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Data Grid */}
                    <Box className={styles.gridBox}>
                        <Box className={styles.gridHeader}>
                            <Typography className={styles.gridTitle}>
                                {source === 'crm' ? 'CRM Contacts' : 'Imported Contacts'}
                            </Typography>
                        </Box>

                        {tableData.loading ? (
                            <Box display="flex" justifyContent="center" my={8}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <AudienceGrid
                                rows={
                                    filteredRows !== null
                                        ? filteredRows
                                        : source === 'crm'
                                            ? tableData.rows
                                            : excelData.rows
                                }
                                onRowSelectionModelChange={handleRowSelectionModelChange}
                                rowSelectionModel={rowSelectionModel}
                                onFilterClick={toggleFilterDrawer}
                                source={source}
                                setRowSelectionData={setRowSelectionData}
                                loading={source === 'crm' ? tableData.loading : excelData.loading}
                                rowCount={filteredRows !== null ? filteredRows.length : rowCount}
                                paginationModel={paginationModel}
                                onPaginationModelChange={handlePaginationModelChange}
                                searchText={searchInput}
                                onSearchChange={(value) => {
                                    setSearchInput(value);
                                    debounceSearch(value);
                                }}
                            />
                        )}
                    </Box>
                </Paper>

                {/* Filter Drawer */}
                <FilterDrawer
                    open={filterDrawerOpen}
                    onClose={() => setFilterDrawerOpen(false)}
                    onApplyFilters={handleApplyFilters}
                    filters={{
                        companyName: filters.companyName ? { companyname: filters.companyName } : null,
                        companyType: filters.companyType ? { businessclassname: filters.companyType } : null,
                        state: filters.state ? { StateName: filters.state } : null,
                        city: filters.city ? { City: filters.city } : null,
                        country: filters.country ? { CountryName: filters.country } : null,
                    }}
                />

            </div>
            <StepperNavigation
                currentStep={currentStep}
                steps={steps}
                onNext={handleNext}
                onPrevious={onPrevious}
                nextDisabled={isNextDisabled}
            />
        </>
    );
};

export default AudienceSection;
