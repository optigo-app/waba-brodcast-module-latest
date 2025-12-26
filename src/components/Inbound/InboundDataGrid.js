import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box, CircularProgress } from '@mui/material';

const InboundDataGrid = ({
    data = [],
    loading = false,
    totalRows = 0,
    pageSize = 25,
    onPageChange = () => { },
    onPageSizeChange = () => { }
}) => {
    const columns = [
        {
            field: 'CampaignName',
            headerName: 'Campaign Name',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'TemplateName',
            headerName: 'Template Name',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'CustomerName',
            headerName: 'Customer Name',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'MobileNumber',
            headerName: 'Mobile Number',
            width: 150,
        },
        {
            field: 'ReplyMessage',
            headerName: 'Reply Message',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                }}>
                    {params.value || '-'}
                </Box>
            )
        },
        {
            field: 'ReplyTime',
            headerName: 'Reply Time',
            width: 250,
            renderCell: (params) => params.value || '-',
        },
    ];


    return (
        <Box>
            <DataGrid
                rows={data}
                columns={columns}
                getRowId={(row) => `${row.CampaignName}-${row.MobileNumber}-${row.ReplyTime}`}
                autoHeight
                disableSelectionOnClick
                disableColumnMenu
                loading={loading}
                pagination
                paginationMode="server"
                rowCount={totalRows}
                pageSize={pageSize}
                rowsPerPageOptions={[10, 25, 50]}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                components={{
                    Toolbar: GridToolbar,
                    LoadingOverlay: () => (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    ),
                }}
                componentsProps={{
                    toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { debounceMs: 500 },
                    },
                }}
                sx={{
                    border: '1px solid var(--sidebar-borderColor)',
                    borderRadius: '12px',
                    boxShadow: 'var(--box-shadow-value)',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#fcfcfd',
                        borderBottom: '1px solid var(--sidebar-borderColor)',
                        fontWeight: 'bold',
                    },
                    '& .MuiDataGrid-columnHeader': {
                        borderBottom: '1px solid var(--sidebar-borderColor)',
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid var(--sidebar-borderColor)',
                    },
                    '& .MuiDataGrid-row': {
                        '&:hover': {
                            backgroundColor: 'rgba(115, 103, 240, 0.04)',
                        },
                    },
                    '& .MuiDataGrid-row:last-child .MuiDataGrid-cell': {
                        borderBottom: 'none',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                        '&::-webkit-scrollbar': {
                            width: '4px',
                            height: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#fcfcfd',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: 'var(--sidebar-borderColor)',
                            borderRadius: 9999,
                        },
                    },
                }}
            />
        </Box>
    );
};

export default InboundDataGrid;
