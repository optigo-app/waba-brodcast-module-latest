import React, { useState } from 'react';
import { RefreshCw, EyeOff, Search } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    InputAdornment,
    Button,
    Chip
} from '@mui/material';

// Mock data for approved templates
const approvedTemplates = [
    {
        id: 1,
        name: 'Order Confirmation',
        category: 'UTILITY',
        language: 'en_US',
        status: 'APPROVED',
        lastUsed: '2025-09-10',
        readRate: '75%',
        totalSent: 1000,
        unread: 250
    },
    {
        id: 2,
        name: 'Discount Offer',
        category: 'MARKETING',
        language: 'en_US',
        status: 'APPROVED',
        lastUsed: '2025-09-12',
        readRate: '60%',
        totalSent: 2000,
        unread: 800
    },
    {
        id: 3,
        name: 'Appointment Reminder',
        category: 'UTILITY',
        language: 'en_US',
        status: 'APPROVED',
        lastUsed: '2025-09-05',
        readRate: '85%',
        totalSent: 500,
        unread: 75
    },
    {
        id: 4,
        name: 'Appointment Reminder',
        category: 'UTILITY',
        language: 'en_US',
        status: 'REJECTED',
        lastUsed: '2025-09-05',
        readRate: '0%',
        totalSent: 0,
        unread: 0
    }
];

const ApprovedTemplates = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const handleResend = (template) => {
        setSelectedTemplate(template);
        console.log('Resending template:', template.name, 'to', template.unread, 'unread recipients');
        // Add your resend logic here
    };

    const filteredTemplates = approvedTemplates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || template.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="templates-container">
            <div className="templates-header">
                <h2>Approved Templates</h2>
                <div className="filters">
                    <TextField
                        size="small"
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <select
                        className="category-filter"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="ALL">All Categories</option>
                        <option value="UTILITY">Utility</option>
                        <option value="MARKETING">Marketing</option>
                        <option value="AUTHENTICATION">Authentication</option>
                    </select>
                </div>
            </div>

            <TableContainer component={Paper} className="templates-table">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Template Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Last Used</TableCell>
                            <TableCell>Read Rate</TableCell>
                            <TableCell>Total Sent</TableCell>
                            <TableCell>Unread</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTemplates.map((template) => (
                            <TableRow key={template.id}>
                                <TableCell className="template-name">
                                    <strong>{template.name}</strong>
                                    <div className="text-muted">{template.language}</div>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={template.category}
                                        size="small"
                                        color={template.category === 'UTILITY' ? 'primary' : 'secondary'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={template.status}
                                        size="small"
                                        color={template.status === 'APPROVED' ? 'success' : 'error'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{template.lastUsed}</TableCell>
                                <TableCell>
                                    <div className="read-rate">
                                        <div className="progress-bar">
                                            <div
                                                className="progress"
                                                style={{ width: template.readRate }}
                                            ></div>
                                        </div>
                                        <span>{template.readRate}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{template.totalSent.toLocaleString()}</TableCell>
                                <TableCell>
                                    <div className="unread-count">
                                        <EyeOff size={16} className="icon" />
                                        {template.unread.toLocaleString()}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<RefreshCw size={16} />}
                                        onClick={() => handleResend(template)}
                                        disabled={template.unread === 0}
                                        title={template.unread === 0 ? 'No unread recipients' : 'Resend to unread'}
                                    >
                                        Resend
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default ApprovedTemplates;
