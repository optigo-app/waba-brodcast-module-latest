import React, { useState, useMemo, useEffect } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box, IconButton, CircularProgress } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';

const CampaignTreeTable = ({ data, loading = false, totalRows = 0, onPageChange, onPageSizeChange }) => {
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 15,
    });

    // Handle pagination changes
    const handlePageChange = (newPage) => {
        setPaginationModel(prev => ({ ...prev, page: newPage }));
        onPageChange?.(newPage, paginationModel.pageSize);
    };

    const handlePageSizeChange = (newPageSize) => {
        setPaginationModel(prev => ({
            page: 0, // Reset to first page
            pageSize: newPageSize
        }));
        onPageSizeChange?.(0, newPageSize);
    };

    // Transform the data for the tree structure
    const rows = useMemo(() => {
        let rows = [];
        let id = 1;

        data?.forEach((campaign, campIdx) => {
            // Add campaign row
            const campaignId = `campaign-${campaign.CampaignId}`;
            rows.push({
                id: campaignId,
                type: 'campaign',
                name: campaign.CampaignTitle,
                lastSent: campaign.LastSentDate,
                total: campaign.TotalMessages,
                pending: campaign.Pending,
                sent: campaign.Sent,
                delivered: campaign.Delivered,
                seen: campaign.Seen,
                failed: campaign.Failed,
                replyTo: campaign.ReplyTo,
                parentId: null,
            });

            // Parse TemplateList
            const templates = JSON.parse(campaign.TemplateList || '[]');

            templates.forEach((template, tempIdx) => {
                const templateId = `template-${campaign.CampaignId}-${template.TemplateId}-${template.DataSource}`;
                // Add template row
                rows.push({
                    id: templateId,
                    type: 'template',
                    name: `${template.TemplateName} (${template.DataSource})`,
                    total: template.TotalMessages,
                    pending: template.Pending,
                    sent: template.Sent,
                    delivered: template.Delivered,
                    seen: template.Seen,
                    failed: template.Failed,
                    parentId: campaignId,
                });

                // Add date-wise rows
                template.DateWiseList.forEach((dateItem, dateIdx) => {
                    rows.push({
                        id: `date-${campaign.CampaignId}-${template.TemplateId}-${template.DataSource}-${dateIdx}`,
                        type: 'date',
                        name: dateItem.SendDateTime,
                        total: dateItem.TotalMessages,
                        pending: dateItem.Pending,
                        sent: dateItem.Sent,
                        delivered: dateItem.Delivered,
                        seen: dateItem.Seen,
                        failed: dateItem.Failed,
                        replyTo: dateItem.ReplyTo,
                        parentId: templateId,
                    });
                });
            });
        });

        return rows;
    }, [data]);

    const columns = [
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
            renderCell: (params) => {
                const isExpandable = params.row.type !== 'date';
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: params.row.type === 'template' ? 4 : 0 }}>
                        {isExpandable && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggle(params.id);
                                }}
                            >
                                {expanded.has(params.id) ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                            </IconButton>
                        )}
                        <Box sx={{ ml: isExpandable ? 1 : 11.5 }}>
                            {params.value}
                        </Box>
                    </Box>
                );
            },
        },
        { field: 'total', headerName: 'Total', width: 100 },
        { field: 'pending', headerName: 'Pending', width: 100 },
        { field: 'sent', headerName: 'Sent', width: 100 },
        { field: 'delivered', headerName: 'Delivered', width: 100 },
        { field: 'seen', headerName: 'Seen', width: 100 },
        { field: 'failed', headerName: 'Failed', width: 100 },
        { field: 'replyTo', headerName: 'Replied', width: 100 },
    ];

    // Track expanded rows
    const [expanded, setExpanded] = useState(new Set());

    // Function to get all child IDs for a given parent ID
    const getChildIds = (parentId) => {
        const children = rows.filter(row => row.parentId === parentId);
        let allChildren = [];

        children.forEach(child => {
            allChildren.push(child.id);
            allChildren = [...allChildren, ...getChildIds(child.id)];
        });

        return allChildren;
    };

    // Handle toggle with recursive child handling
    const handleToggle = (id) => {
        const newExpanded = new Set(expanded);

        if (newExpanded.has(id)) {
            // If closing, remove this ID and all its children
            newExpanded.delete(id);
            const childIds = getChildIds(id);
            childIds.forEach(childId => newExpanded.delete(childId));
        } else {
            // If opening, just add this ID
            newExpanded.add(id);
        }

        setExpanded(newExpanded);
    };

    // Filter rows based on expanded state
    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            if (!row.parentId) return true; // Always show root (campaign) rows
            return expanded.has(row.parentId); // Show if parent is expanded
        });
    }, [rows, expanded]);

    return (
        <div style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
            <DataGrid
                rows={filteredRows}
                columns={columns}
                disableSelectionOnClick
                pagination
                paginationMode="server"
                rowCount={totalRows}
                page={paginationModel.page}
                pageSize={paginationModel.pageSize}
                rowsPerPageOptions={[10, 15, 25, 50]}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
                disableColumnMenu
                sx={{
                    border: '1px solid var(--sidebar-borderColor)',
                    borderRadius: '12px',
                    boxShadow: 'var(--box-shadow-value)',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#fcfcfd',
                        borderBottom: '1px solid var(--sidebar-borderColor)',
                    },
                    '& .MuiDataGrid-columnHeader': {
                        borderBottom: '1px solid var(--sidebar-borderColor)',
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid var(--sidebar-borderColor)',
                    },
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                        outline: 'none',
                    },
                    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                        outline: 'none',
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
                            backgroundColor: '#fcfcfd',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'var(--sidebar-borderColor)',
                            borderRadius: 9999,
                        },
                    },
                }}
                components={{
                    Toolbar: GridToolbar,
                    LoadingOverlay: () => (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    ),
                }}
                getRowClassName={(params) => {
                    if (params.row.type === 'campaign') return 'campaign-row';
                    if (params.row.type === 'template') return 'template-row';
                    return 'date-row';
                }}
            />
            <style jsx global>{`
        .MuiDataGrid-row.campaign-row {
          font-weight: 600;
        }
        .MuiDataGrid-row.template-row {
          font-weight: 500;
        }
        .MuiDataGrid-row.date-row {
          background-color: #ffffff;
        }
      `}</style>
        </div>
    );
};

export default CampaignTreeTable;