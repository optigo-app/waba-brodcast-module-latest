import React, { useState, useCallback } from 'react';
import {
  DataGrid,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
} from '@mui/x-data-grid';
import { TextField, InputAdornment, Box, IconButton, Tooltip, LinearProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import styles from './AudienceSection.module.scss';

// Custom toolbar with search and filter buttons
const CustomToolbar = ({ onFilterClick, onSearchChange, searchText, selectedCount = 0 }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(125, 127, 133, 0.6)' }} />
              </InputAdornment>
            ),
            sx: {
              height: 40,
              borderRadius: '12px',
              backgroundColor: '#fcfcfd',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--sidebar-borderColor)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(90, 90, 90, 0.15)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--primary-main)',
                borderWidth: '2px',
              }
            }
          }}
          sx={{ width: 320 }}
        />
        <Tooltip title="Filter">
          <IconButton
            onClick={onFilterClick}
            size="small"
            sx={{
              border: '1px solid var(--sidebar-borderColor)',
              borderRadius: '10px',
              backgroundColor: '#fcfcfd',
              color: 'var(--secondary-color)',
              p: 1
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ fontSize: '0.875rem', color: 'var(--secondary-color)', mr: 1 }}>
          Selected: {selectedCount}
        </Box>
        <GridToolbarColumnsButton size="small" />
        <GridToolbarFilterButton size="small" />
        <GridToolbarDensitySelector size="small" />
        <GridToolbarExport size="small" />
      </Box>
    </Box>
  );
};

const AudienceGrid = ({
  rows = [],
  onRowSelectionModelChange,
  rowSelectionModel,
  onFilterClick,
  source,
  loading = false,
  rowCount = 0,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions = [10]
}) => {
  const [searchText, setSearchText] = useState('');

  // Ensure rowSelectionModel is always in object format with Set
  const safeRowSelectionModel = React.useMemo(() => {
    // Return a valid object with Set to prevent undefined errors
    if (!rowSelectionModel || typeof rowSelectionModel !== 'object') {
      return { type: 'include', ids: new Set() };
    }
    if (rowSelectionModel?.ids instanceof Set) {
      return rowSelectionModel;
    }
    if (Array.isArray(rowSelectionModel)) {
      return { type: 'include', ids: new Set(rowSelectionModel) };
    }
    // Fallback: if it's an object but ids is not a Set, convert to Set
    if (rowSelectionModel.ids) {
      return { type: 'include', ids: new Set(Array.isArray(rowSelectionModel.ids) ? rowSelectionModel.ids : []) };
    }
    return { type: 'include', ids: new Set() };
  }, [rowSelectionModel]);

  const selectedCount = safeRowSelectionModel?.ids?.size || 0;

  const getRowSerialNumber = (params) => {
    const currentRowId = params?.row?.CustomerId || params?.row?.id;

    if (currentRowId !== undefined && currentRowId !== null) {
      const indexById = rows.findIndex((row) => (row?.CustomerId || row?.id) === currentRowId);
      if (indexById >= 0) {
        return indexById + 1;
      }
    }

    const nodeIndex = params?.rowNode?.index;
    if (typeof nodeIndex === 'number' && nodeIndex >= 0) {
      return nodeIndex + 1;
    }

    return '';
  };

  // Define columns for the DataGrid
  const columns = [
    {
      field: 'SrNo',
      headerName: 'Sr No',
      width: 70,
      type: 'number',
      headerClassName: 'data-grid-header',
      renderCell: (params) => getRowSerialNumber(params),
    },
    {
      field: 'CustomerCode',
      headerName: 'Customer Code',
      width: 180,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'CustomerName',
      headerName: 'Name',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'CompanyType',
      headerName: 'Company type',
      width: 150,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'CustomerEmail',
      headerName: 'Email',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'CustomerPhone',
      headerName: 'Phone',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'CountryCode',
      headerName: 'Country Code',
      width: 130,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'Country',
      headerName: 'Country',
      width: 120,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'State',
      headerName: 'State',
      width: 120,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'City',
      headerName: 'City',
      width: 120,
      headerClassName: 'data-grid-header',
    },
  ];

  const columns1 = [
    {
      field: 'CustomerName',
      headerName: 'Customer name',
      width: 70,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'Email',
      headerName: 'Email',
      width: 150,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'PhoneNo',
      headerName: 'Phone number',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'Company',
      headerName: 'Company',
      width: 250,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'CustomerType',
      headerName: 'Customer type',
      width: 150,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'Category',
      headerName: 'Category',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'Source',
      headerName: 'Source',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'PinCode',
      headerName: 'PinCode',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'City',
      headerName: 'City',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'State',
      headerName: 'State',
      width: 120,
      headerClassName: 'data-grid-header',
    },
  ];

  // Filter rows based on search text
  const filteredRows = React.useMemo(() => {
    if (!searchText) return rows;

    const searchLower = searchText.toLowerCase();
    return rows.filter(row =>
      Object.values(row).some(
        value => value &&
          value.toString().toLowerCase().includes(searchLower)
      )
    );
  }, [rows, searchText]);

  const handleSearchChange = useCallback((newSearchText) => {
    setSearchText(newSearchText);
  }, []);

  const handleSelectionChange = useCallback((newRowSelectionModel) => {
    onRowSelectionModelChange && onRowSelectionModelChange(newRowSelectionModel);
  }, [onRowSelectionModelChange]);

  return (
    <Box className={styles.dataGridContainer}>
      <DataGrid
        rows={filteredRows}
        columns={source === "crm" ? columns : columns1}
        checkboxSelection
        disableSelectionOnClick
        keepNonExistentRowsSelected
        hideFooterPagination={true}
        pagination
        pageSizeOptions={pageSizeOptions}
        paginationMode="server"
        rowCount={rowCount}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        virtualizeColumnsWithAutoRowHeight={true}
        onRowSelectionModelChange={handleSelectionChange}
        rowSelectionModel={safeRowSelectionModel}
        loading={loading}
        getRowId={(row) => row.CustomerId || row.id || Math.random().toString(36).substr(2, 9)}
        components={{
          Toolbar: CustomToolbar,
          LoadingOverlay: LinearProgress,
        }}
        componentsProps={{
          toolbar: {
            onFilterClick: onFilterClick,
            onSearchChange: handleSearchChange,
            searchText: searchText,
            selectedCount: selectedCount,
          },
        }}
        sx={{
          '&.MuiDataGrid-root': {
            border: '1px solid var(--sidebar-borderColor)',
            borderRadius: '12px',
            boxShadow: 'var(--box-shadow-value)'
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--sidebar-borderColor)',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid var(--sidebar-borderColor)',
          },
          '& .MuiDataGrid-columnHeader': {
            fontWeight: 'bold',
            borderBottom: '1px solid var(--sidebar-borderColor)',
          },
          '& .MuiDataGrid-virtualScroller': {
            minHeight: '300px',
          },
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:last-child .MuiDataGrid-cell': {
            borderBottom: 'none',
          },
        }}
      />
    </Box>
  );
};

export default AudienceGrid;
