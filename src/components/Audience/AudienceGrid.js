import React, { useState, useCallback, useMemo, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, InputAdornment, Box, IconButton, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from '@mui/x-data-grid';
import styles from './AudienceSection.module.scss';

// ── Stable column definitions (never recreated) ───────────────────────────────
const CRM_COLUMNS = [
  { field: 'SrNo',          headerName: '#',             width: 60,  type: 'number', headerClassName: 'data-grid-header' },
  { field: 'CustomerCode',  headerName: 'Customer Code', width: 160, headerClassName: 'data-grid-header' },
  { field: 'CustomerName',  headerName: 'Name',          width: 200, headerClassName: 'data-grid-header' },
  { field: 'CompanyType',   headerName: 'Company Type',  width: 150, headerClassName: 'data-grid-header' },
  { field: 'CustomerEmail', headerName: 'Email',         width: 220, headerClassName: 'data-grid-header' },
  { field: 'CustomerPhone', headerName: 'Phone',         width: 160, headerClassName: 'data-grid-header' },
  { field: 'CountryCode',   headerName: 'Country Code',  width: 120, headerClassName: 'data-grid-header' },
  { field: 'Country',       headerName: 'Country',       width: 120, headerClassName: 'data-grid-header' },
  { field: 'State',         headerName: 'State',         width: 120, headerClassName: 'data-grid-header' },
  { field: 'City',          headerName: 'City',          width: 120, headerClassName: 'data-grid-header' },
];

const EXCEL_COLUMNS = [
  { field: 'SrNo',         headerName: '#',             width: 60,  type: 'number', headerClassName: 'data-grid-header' },
  { field: 'CustomerName', headerName: 'Customer Name', width: 200, headerClassName: 'data-grid-header' },
  { field: 'Email',        headerName: 'Email',         width: 220, headerClassName: 'data-grid-header' },
  { field: 'PhoneNo',      headerName: 'Phone',         width: 160, headerClassName: 'data-grid-header' },
  { field: 'Company',      headerName: 'Company',       width: 220, headerClassName: 'data-grid-header' },
  { field: 'CustomerType', headerName: 'Type',          width: 140, headerClassName: 'data-grid-header' },
  { field: 'Category',     headerName: 'Category',      width: 160, headerClassName: 'data-grid-header' },
  { field: 'Source',       headerName: 'Source',        width: 160, headerClassName: 'data-grid-header' },
  { field: 'PinCode',      headerName: 'Pin Code',      width: 120, headerClassName: 'data-grid-header' },
  { field: 'City',         headerName: 'City',          width: 120, headerClassName: 'data-grid-header' },
  { field: 'State',        headerName: 'State',         width: 120, headerClassName: 'data-grid-header' },
];

// ── Stable sx object (never recreated) ───────────────────────────────────────
const GRID_SX = {
  border: '1px solid var(--sidebar-borderColor)',
  borderRadius: '12px',
  boxShadow: 'var(--box-shadow-value)',
  '& .MuiDataGrid-columnHeaders': { backgroundColor: '#fff', borderBottom: '1px solid var(--sidebar-borderColor)' },
  '& .MuiDataGrid-cell': { borderBottom: '1px solid var(--sidebar-borderColor)' },
  '& .MuiDataGrid-columnHeader': { fontWeight: 700, borderBottom: '1px solid var(--sidebar-borderColor)' },
  '& .MuiDataGrid-virtualScroller': { minHeight: 300 },
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-row:last-child .MuiDataGrid-cell': { borderBottom: 'none' },
};

// ── Toolbar — fully memoized, stable prop shape ───────────────────────────────
const CustomToolbar = React.memo(({ onFilterClick, onSearchChange, searchText, selectedCount }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, gap: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <TextField
        variant="outlined"
        size="small"
        placeholder="Search..."
        value={searchText}
        onChange={onSearchChange}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(125,127,133,0.6)', fontSize: 18 }} />
              </InputAdornment>
            ),
            sx: {
              height: 36,
              borderRadius: '10px',
              backgroundColor: '#fcfcfd',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--sidebar-borderColor)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(90,90,90,0.2)' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary-main)', borderWidth: 2 },
            },
          },
        }}
        sx={{ width: 260 }}
      />
      <Tooltip title="Filter audience">
        <IconButton
          onClick={onFilterClick}
          size="small"
          sx={{ border: '1px solid var(--sidebar-borderColor)', borderRadius: '10px', backgroundColor: '#fcfcfd', color: 'var(--secondary-color)', p: 0.75 }}
        >
          <FilterListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ fontSize: '0.8rem', color: 'var(--secondary-color)', mr: 0.5, whiteSpace: 'nowrap' }}>
        Selected: {selectedCount}
      </Box>
      <GridToolbarColumnsButton size="small" />
      <GridToolbarFilterButton size="small" />
      <GridToolbarDensitySelector size="small" />
      <GridToolbarExport size="small" />
    </Box>
  </Box>
));

// ── Stable slots object (defined once at module level) ────────────────────────
const GRID_SLOTS = { toolbar: CustomToolbar };

// ── Stable empty Set to avoid new reference on every render ──────────────────
const EMPTY_SET = new Set();
const EMPTY_SELECTION = { type: 'include', ids: EMPTY_SET };

// ── AudienceGrid ──────────────────────────────────────────────────────────────
const AudienceGrid = ({
  rows = [],
  onRowSelectionModelChange,
  rowSelectionModel,
  onFilterClick,
  source,
  loading = false,
  pageSizeOptions = [20, 50, 100],
  searchText: externalSearchText,
  onSearchChange: externalOnSearchChange,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const searchText = externalSearchText !== undefined ? externalSearchText : internalSearch;

  // Stable onChange handler passed directly to TextField — avoids wrapper arrow
  const handleSearchInputChange = useCallback((e) => {
    const val = e.target.value;
    if (externalOnSearchChange) externalOnSearchChange(val);
    else setInternalSearch(val);
  }, [externalOnSearchChange]);

  // Normalize selection model — only recompute when reference changes
  const safeSelection = useMemo(() => {
    if (!rowSelectionModel) return EMPTY_SELECTION;
    if (rowSelectionModel.ids instanceof Set) return rowSelectionModel;
    if (Array.isArray(rowSelectionModel)) return { type: 'include', ids: new Set(rowSelectionModel) };
    if (rowSelectionModel.ids) return { type: 'include', ids: new Set(rowSelectionModel.ids) };
    return EMPTY_SELECTION;
  }, [rowSelectionModel]);

  const selectedCount = safeSelection.ids.size;

  // Build rows with SrNo injected — single pass, no spread of every field
  // We use a Map to avoid O(n²) index lookup
  const processedRows = useMemo(() => {
    return rows.map((row, i) => {
      // Only add SrNo if not already present — avoid full object spread when possible
      if (row.SrNo === i + 1) return row;
      return { ...row, SrNo: i + 1 };
    });
  }, [rows]);

  // Precompute search blobs once per rows change — O(n) upfront, O(1) per filter
  const searchBlobs = useMemo(() => {
    return processedRows.map((row) => {
      // Build blob from only the visible column fields to keep it lean
      const fields = source === 'crm'
        ? [row.CustomerCode, row.CustomerName, row.CompanyType, row.CustomerEmail, row.CustomerPhone, row.Country, row.State, row.City]
        : [row.CustomerName, row.Email, row.PhoneNo, row.Company, row.CustomerType, row.Category, row.City, row.State];
      return fields.filter(Boolean).join(' ').toLowerCase();
    });
  }, [processedRows, source]);

  // Filter using precomputed blobs — no per-row Object.values() call
  const filteredRows = useMemo(() => {
    const q = searchText?.trim().toLowerCase();
    if (!q) return processedRows;
    return processedRows.filter((_, i) => searchBlobs[i].includes(q));
  }, [processedRows, searchBlobs, searchText]);

  const handleSelectionChange = useCallback((model) => {
    onRowSelectionModelChange?.(model);
  }, [onRowSelectionModelChange]);

  // Stable getRowId — no random fallback (causes re-renders)
  const getRowId = useCallback((row) => row.CustomerId ?? row.id ?? row.PhoneNo ?? row.Email, []);

  // Stable toolbar props — only recompute when actual values change
  const slotProps = useMemo(() => ({
    toolbar: {
      onFilterClick,
      onSearchChange: handleSearchInputChange,
      searchText,
      selectedCount,
    },
  }), [onFilterClick, handleSearchInputChange, searchText, selectedCount]);

  const columns = source === 'crm' ? CRM_COLUMNS : EXCEL_COLUMNS;

  return (
    <Box sx={{ width: '100%', height: '100%', overflowX: 'auto' }}>
      <Box sx={{ minWidth: 400, height: '100%' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          keepNonExistentRowsSelected
          loading={loading}
          getRowId={getRowId}
          rowSelectionModel={safeSelection}
          onRowSelectionModelChange={handleSelectionChange}
          paginationMode="client"
          initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
          pageSizeOptions={pageSizeOptions}
          slots={GRID_SLOTS}
          slotProps={slotProps}
          sx={{ ...GRID_SX, height: '100%' }}
          rowHeight={40}
          columnHeaderHeight={44}
        />
      </Box>
    </Box>
  );
};

export default React.memo(AudienceGrid);
