import React, { useEffect, useMemo, useState } from 'react';
import './MessageComposer.scss';
import {
  Paper, Box, TextField,
  InputAdornment, Typography,
  Checkbox, Button
} from '@mui/material';
import { Search } from 'lucide-react';
import { useStepper } from '../../context/StepperContext';
import { fetchCampaignLists } from '../../API/CampaignList/CampaignList'; 
import OptionModal1 from './OptionalModal1';
import { addCampaign } from '../../API/AddCampaign/AddCampaign';
import toast from 'react-hot-toast';
import { useAuthToken } from '../../hooks/useAuthToken';
import { useTheme } from '@mui/material/styles';

const MessageComposer = ({
  onMessageChange,
  selectedTemplate,
  currentStep,
  onTemplateSelect,
  onSaveTemplate
}) => {
  const [openCampaigns, setOpenCampaigns] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState(null);
  const theme = useTheme();
  const { userToken, tokenChecked, clearToken } = useAuthToken();

  const handleCampaignClick = (campaignId) => {
    setOpenCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all campaigns without pagination
      const result = await fetchCampaignLists(userToken?.userId); // Using a large page size to get all data

      if (result?.data) {
        const formattedData = result.data.map(campaign => ({
          ...campaign,
          Templates:
            typeof campaign.Templates === 'string'
              ? JSON.parse(campaign.Templates)
              : campaign.Templates || []
        }));

        setAllCampaigns(formattedData);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2) fetchCampaigns();
  }, [currentStep, page, rowsPerPage]);

  const paginatedCampaigns = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return allCampaigns.slice(startIndex, startIndex + rowsPerPage);
  }, [allCampaigns, page, rowsPerPage]);

  const filteredCampaigns = useMemo(() => {
    if (!searchTerm) return paginatedCampaigns;

    const searchLower = searchTerm.toLowerCase();
    return allCampaigns.filter(campaign => {
      const matchesCampaign = campaign.Name?.toLowerCase().includes(searchLower);
      const matchesTemplate = campaign.Templates?.some(template =>
        (template.TemplateName || template.Name)?.toLowerCase().includes(searchLower) ||
        (template.TemplateType || template.Type)?.toLowerCase().includes(searchLower)
      );
      return matchesCampaign || matchesTemplate;
    });
  }, [allCampaigns, paginatedCampaigns, searchTerm]);


  const [templateData, setTemplateData] = useState({
    campaignName: "",
    templateName: "",
    templateLanguage: "",
    templateCategory: "",
    headerFormat: "",
    headerText: "",
    templateFooter: "",
    message: "",
    buttons: []
  });

  const [openModal, setOpenModal] = useState(false);

  const handleMessageChange = (newData) => {
    setTemplateData(prev => ({ ...prev, ...newData, message: newData.message || "" }));
    if (onMessageChange) onMessageChange({ ...newData, message: newData.message || "" });
  };

  const handleSaveTemplate = async (template) => {
    sessionStorage.setItem("savedTemplate", JSON.stringify(template));
    try {
      const result = await addCampaign(userToken?.userId, template.campaignName, template.templateId);
      if (result?.data?.rd[0]?.stat === 0) {
        toast.error(result?.data?.rd[0]?.stat_msg);
        return;
      }
      toast.success(result?.data?.rd[0]?.stat_msg);
      fetchCampaigns();
    } catch (error) {
      console.error(error);
    }
    if (onSaveTemplate) onSaveTemplate(template);
    setOpenModal(false);
  };

  const { setSelectedTemplates: setContextTemplates } = useStepper();
  const { selectedTemplates: contextTemplates = [] } = useStepper(); // Get templates from context

  useEffect(() => {
    if (contextTemplates && contextTemplates.length > 0) {
      setSelectedTemplates(contextTemplates);
    }
  }, [contextTemplates]);

  const handleTemplateSelect = async (templateId, campaignId) => {
    try {
      const isSelected = selectedTemplates.some(
        t => t.Id === templateId && t.campaignId === campaignId
      );
      const hasAnyOtherSelected = selectedTemplates.length > 0 && !isSelected;

      if (!isSelected && hasAnyOtherSelected) {
        toast.error("You can select only one template across all campaigns.");
        return;
      }

      let newSelectedTemplates;
      if (isSelected) {
        newSelectedTemplates = selectedTemplates.filter(
          t => !(t.Id === templateId && t.campaignId === campaignId)
        );
      } else {
        const campaign = allCampaigns.find(c => c.Id === campaignId);
        const found = campaign?.Templates?.find(t => t.Id === templateId);

        if (!found) {
          console.error('Template not found:', templateId);
          return;
        }

        const templateToAdd = {
          ...found,
          campaignId: campaign.Id,
          compositeId: `${campaignId}_${templateId}`,
        };

        newSelectedTemplates = [templateToAdd];
      }

      setSelectedTemplates(newSelectedTemplates);
      setContextTemplates(newSelectedTemplates);

      if (newSelectedTemplates.length === 1) {
        const selectedTemplate = newSelectedTemplates[0];
        const newTemplateData = {
          templateName: selectedTemplate.TemplateName || selectedTemplate.templateName || selectedTemplate.Name || "Dummy template",
          templateLanguage: selectedTemplate.templateLanguage || "en_US",
          templateCategory: selectedTemplate.TemplateType || selectedTemplate.templateCategory || "UTILITY",
          campaignName: selectedTemplate.campaignName || selectedTemplate.campaign?.Name || "Campaign",
          headerFormat: selectedTemplate.headerFormat || "text",
          media: selectedTemplate.defaultImage
            ? {
              dataUrl: selectedTemplate.defaultImage,
              name: selectedTemplate.defaultImage.includes("qr-code") ? "qr-code.svg" : "template-image.jpg",
              type: selectedTemplate.defaultImage.includes("svg") ? "image/svg+xml" : "image/jpeg"
            }
            : null,
          templateFooter: selectedTemplate.templateFooter || ""
        };

        setTemplateData(prev => ({ ...prev, ...newTemplateData }));

        if (onTemplateSelect) {
          onTemplateSelect({ ...newTemplateData, templateId: selectedTemplate.Id });
        }
      } else {
        setTemplateData(prev => ({ ...prev, templateName: "", message: "" }));
        if (onTemplateSelect) onTemplateSelect(null);
      }
    } catch (error) {
      console.error("Error in handleTemplateSelect:", error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box className="message-templates">
        <Box className="header">
          <Typography className="title">Campaign Lists</Typography>
          <Button onClick={() => setOpenModal(true)} className="toggle-btn" variant="contained" disableElevation>
            Create Campaign
          </Button>
        </Box>

        <Box className="search-bar-container">
          <TextField
            fullWidth
            type='search'
            variant="outlined"
            placeholder="Search campaigns or templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Paper className="campaign-table-container">
          <Box className="campaign-list-scroll">
            {filteredCampaigns.map((campaign) => (
              <Box key={campaign.Id} className="campaign-card">
                <Box className="campaign-card-header">
                  <Typography className="campaign-name-cell">{campaign.Name}</Typography>
                  <Typography className="templates-count-cell">{campaign.Templates.length} templates</Typography>
                </Box>

                <Box className="template-list">
                  {campaign.Templates.length === 0 && (
                    <Typography className="empty-template-text">No templates in this campaign</Typography>
                  )}

                  {campaign.Templates.map((template) => {
                    const isSelected = selectedTemplates.some(
                      t => t.Id === template.Id && t.campaignId === campaign.Id
                    );

                    const isDisabled =
                      selectedTemplates.length > 0 &&
                      !selectedTemplates.some(
                        t => t.Id === template.Id && t.campaignId === campaign.Id
                      );

                    return (
                      <Box
                        key={`${campaign.Id}_${template.Id}`}
                        className={`template-row${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
                        onClick={() => {
                          if (!isDisabled) {
                            handleTemplateSelect(template.Id, campaign.Id);
                          }
                        }}
                      >
                        <Box className="template-checkbox-cell">
                          <Checkbox
                            color="primary"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => handleTemplateSelect(template.Id, campaign.Id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Box>

                        <Box className="template-meta">
                          <Typography variant="body2" className="template-name">
                            {template.TemplateName || template.Name}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}

            {!loading && filteredCampaigns.length === 0 && (
              <Box className="empty-campaign-state">
                <Typography>No campaigns found</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <OptionModal1
        openModal={openModal}
        setOpenModal={setOpenModal}
        setUploadedMedia={setUploadedMedia}
        uploadedMedia={uploadedMedia}
        message={templateData.message}
        onMessageChange={handleMessageChange}
        onSave={handleSaveTemplate}
        templateData={templateData}
      />
    </Box>
  );
};

export default MessageComposer;
