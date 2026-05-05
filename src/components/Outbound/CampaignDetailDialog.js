import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { User, Phone, Calendar, Clock, Send, CheckCircle, XCircle, Reply, Loader } from 'lucide-react';

const CampaignDetailDialog = ({ open, onClose, rowData }) => {
  if (!rowData) return null;

  const stats = [
    { label: 'Total', value: rowData.total || 0, icon: <Loader size={18} />, color: '#7367f0' },
    { label: 'Pending', value: rowData.pending || 0, icon: <Clock size={18} />, color: '#f57c00' },
    { label: 'Sent', value: rowData.sent || 0, icon: <Send size={18} />, color: '#00CFE8' },
    { label: 'Delivered', value: rowData.delivered || 0, icon: <CheckCircle size={18} />, color: '#1d9051' },
    { label: 'Failed', value: rowData.failed || 0, icon: <XCircle size={18} />, color: '#d32f2f' },
    { label: 'Replied', value: rowData.replyTo || 0, icon: <Reply size={18} />, color: '#7367f0' },
  ];

  const getTypeLabel = (type) => {
    switch (type) {
      case 'campaign':
        return 'Campaign';
      case 'template':
        return 'Template';
      case 'date':
        return 'Date';
      default:
        return 'Unknown';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: '1100px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid var(--sidebar-borderColor)',
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#444050' }}>
            Campaign Details
          </Typography>
          <Typography variant="body2" sx={{ color: '#7D7f85', mt: 0.5 }}>
            {getTypeLabel(rowData.type)}: {rowData.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Customer Information Section - 20% */}
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 2.5,
                backgroundColor: '#f5f5f5',
                borderRadius: '16px',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <User size={18} color="#7367f0" style={{ flexShrink: 0, marginTop: 2 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#7D7f85', display: 'block', fontSize: '0.75rem' }}>
                    Campaign
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#444050', fontSize: '0.875rem' }}>
                    {rowData.name}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Calendar size={18} color="#7367f0" style={{ flexShrink: 0, marginTop: 2 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#7D7f85', display: 'block', fontSize: '0.75rem' }}>
                    Date Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#444050', fontSize: '0.875rem' }}>
                    {rowData.lastSent || rowData.name}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Clock size={18} color="#7367f0" style={{ flexShrink: 0, marginTop: 2 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#7D7f85', display: 'block', fontSize: '0.75rem' }}>
                    Type
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#444050', fontSize: '0.875rem' }}>
                    {getTypeLabel(rowData.type)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Statistics Section - 80% */}
          <Grid size={{ xs: 12, sm: 6, md: 9.6 }}>
            <Grid container spacing={2}>
              {stats.map((stat) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={stat.label}>
                  <Box
                    sx={{
                      p: 2.5,
                      backgroundColor: `${stat.color}14`,
                      borderRadius: '16px',
                      border: `1px solid ${stat.color}30`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: `${stat.color}22`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                      <Typography variant="body2" sx={{ color: '#7D7f85', fontWeight: 500 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#444050', fontSize: '1.75rem' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions sx={{ p: 3, borderTop: '1px solid var(--sidebar-borderColor)' }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: '#7367f0',
            color: '#ffffff',
            fontWeight: 500,
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            '&:hover': {
              backgroundColor: '#5e52d1',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CampaignDetailDialog;
