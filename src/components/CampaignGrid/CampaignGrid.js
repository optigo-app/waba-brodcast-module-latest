import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Chip, CircularProgress, Button } from '@mui/material';
import toast from 'react-hot-toast';
import { fetchCampaignStatusListsApi } from '../../API/CampaignList/CampaignStatusApi';
import { startCron } from '../../API/startCron/startCron';
import { useAuthToken } from '../../hooks/useAuthToken';
import { formatDate } from '../../utils/globalFunc';

const CampaignGrid = () => {
  const [loading, setLoading] = useState(false);
  const [cronLoading, setCronLoading] = useState(false);
  const [data, setData] = useState([]);
  const { userToken } = useAuthToken();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const result = await fetchCampaignStatusListsApi(userToken?.userId);
        if (result?.data) {
          const dataWithIds = result.data.map((row, index) => ({
            id: index,
            campaign_name: row.CampaignName,
            template_name: row.TemplateName,
            type: row.Type,
            status: row.Status,
            receiver: row.Receiver,
            created_on: formatDate(row.CreatedOn),
            scheduled_for: formatDate(row.ScheduledFor),
            completed_on: formatDate(row.CompletedOn),
          }));
          setData(dataWithIds);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [userToken?.userId]);

  const handleStartCron = async () => {
    try {
      setCronLoading(true);
      const response = await startCron(userToken?.userId);
      if (response?.Status === '200' || response?.success) {
        toast.success('Campaign launched successfully');
      } else {
        toast.error('Failed to launch campaign');
      }
    } catch (error) {
      console.error('Error launching campaign:', error);
      toast.error('Failed to launch campaign');
    } finally {
      setCronLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { backgroundColor: 'rgba(29, 144, 81, 0.12)', color: '#1d9051' };
      case 'pending':
        return { backgroundColor: 'rgba(245, 124, 0, 0.12)', color: '#f57c00' };
      case 'failed':
        return { backgroundColor: 'rgba(211, 47, 47, 0.12)', color: '#d32f2f' };
      default:
        return { backgroundColor: 'rgba(115, 103, 240, 0.12)', color: '#7367f0' };
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'schedule':
        return { backgroundColor: 'rgba(0, 207, 232, 0.12)', color: '#00CFE8' };
      case 'immediate':
        return { backgroundColor: 'rgba(29, 144, 81, 0.12)', color: '#1d9051' };
      case 'reaccuring':
        return { backgroundColor: 'rgba(115, 103, 240, 0.12)', color: '#7367f0' };
      default:
        return { backgroundColor: 'rgba(115, 103, 240, 0.12)', color: '#7367f0' };
    }
  };

  const columns = [
    {
      field: 'campaign_name',
      headerName: 'Campaign Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'template_name',
      headerName: 'Template Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            ...getTypeColor(params.value),
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'capitalize',
          }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            ...getStatusColor(params.value),
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'capitalize',
          }}
        />
      ),
    },
    {
      field: 'receiver',
      headerName: 'Receiver',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: 'rgba(115, 103, 240, 0.12)',
            color: '#7367f0',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        />
      ),
    },
    {
      field: 'created_on',
      headerName: 'Created On',
      width: 180,
    },
    {
      field: 'scheduled_for',
      headerName: 'Scheduled For',
      width: 180,
    },
    {
      field: 'completed_on',
      headerName: 'Completed On',
      width: 180,
    },
  ];

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleStartCron}
          disabled={cronLoading}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            backgroundColor: '#7367f0',
            '&:hover': {
              backgroundColor: '#5e50e0',
            },
          }}
        >
          {cronLoading ? 'Launching...' : 'Launch Campaign'}
        </Button>
      </Box>
      <Box
        sx={{
          height: 'calc(100vh - 260px)',
          width: '100%',
        }}
      >
        <DataGrid
          rows={data}
          columns={columns}
          loading={loading}
          disableSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
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
            LoadingOverlay: () => (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default CampaignGrid;
