import React, { useState, useEffect } from 'react';
import { Plus, User, MessageSquare, FileText, Send, Megaphone, ArrowLeft } from 'lucide-react';
import { TextField, FormControlLabel, Checkbox, Button, Typography, Paper } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './AddCampaign.module.scss';
import CampaignDetails from './Steps/CampaignDetails';
import Audience from './Steps/Audience';
import Message from './Steps/Message';
import PreviewSave from './Steps/PreviewSave';
import { createCampaign } from '../../API/AddCampaign/AddCampaign';
import { useAuthToken } from '../../hooks/useAuthToken';
import toast from 'react-hot-toast';
import { normalizePhoneNumber } from '../../utils/globalFunc';

const STEPS = [
  { id: 'details', label: 'Campaign Details', icon: FileText, step: 1 },
  { id: 'audience', label: 'Audience', icon: User, step: 2 },
  { id: 'message', label: 'Message', icon: MessageSquare, step: 3 },
  { id: 'preview', label: 'Preview & Save', icon: Send, step: 4 },
];

const RETARGET_STATUS_OPTIONS = ['Overall', 'Sent', 'Delivered', 'Read', 'Failed', 'Replied'];

const AddCampaign = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userToken } = useAuthToken();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignType, setCampaignType] = useState('immediate');
  const [repeat, setRepeat] = useState(false);
  const [campaignId, setCampaignId] = useState(() => {
    // For edit/clone, use existing campaignId from location state
    if (location.state?.campaign?.Id) {
      return location.state.campaign.Id.toString();
    }
    // For new campaigns, generate random campaignId
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  });
  const [campaignName, setCampaignName] = useState('');
  const [campaignNameError, setCampaignNameError] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(null);
  const [audience, setAudience] = useState([]);
  const [audienceGridData, setAudienceGridData] = useState([]);
  const [dataSource, setDataSource] = useState('optigo');
  const [customerFilters, setCustomerFilters] = useState({
    filters: {
      companyName: null,
      companyType: null,
      state: null,
      city: null,
      country: null,
    },
    searchTerm: '',
    selectedBranches: [],
    selectedGroup: null,
  });
  const [messageConfigured, setMessageConfigured] = useState(false);
  const [showError, setShowError] = useState(false);
  const [audienceError, setAudienceError] = useState(false);
  const [messageError, setMessageError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  const [isRetargetFlow, setIsRetargetFlow] = useState(false);
  const [retargetSourceCampaignName, setRetargetSourceCampaignName] = useState('');
  const [retargetStatus, setRetargetStatus] = useState('Overall');
  const [retargetSourceCampaignId, setRetargetSourceCampaignId] = useState(null);
  const [retargetChatMsgStatusId, setRetargetChatMsgStatusId] = useState(null);

  const buildRetargetName = (sourceCampaignName, statusLabel) => `retarget-${sourceCampaignName || 'Campaign'}-${statusLabel || 'Overall'}`;

  // Pre-fill form data when cloning or editing
  useEffect(() => {
    if (location.state?.campaign) {
      const campaign = location.state.campaign;
debugger
      const isRetarget = !!campaign.isRetarget;
      setIsRetargetFlow(isRetarget);
      if (isRetarget) {
        const sourceCampaignName = campaign.RetargetSourceCampaignName || campaign.CampaignName || campaign.Name || 'Campaign';
        const statusLabel = campaign.RetargetStatusLabel || 'Overall';
        setRetargetSourceCampaignName(sourceCampaignName);
        setRetargetStatus(statusLabel);
        setRetargetSourceCampaignId(campaign.RetargetSourceCampaignId || null);
        setRetargetChatMsgStatusId(campaign.Status || null);
        setCampaignName(buildRetargetName(sourceCampaignName, statusLabel));
      }

      // Pre-fill campaign details
      if (campaign.Name && !isRetarget) setCampaignName(campaign.Name);
      if (campaign.Type) {
        setCampaignType(campaign.Type === 1 ? 'immediate' : campaign.Type === 2 ? 'scheduled' : 'recurring');
      }
      if (campaign.ScheduleTime) setScheduledFor(dayjs(campaign.ScheduleTime));

      // Pre-fill CustomerFilters if exists
      if (campaign.CustomerFilters) {
        try {
          const parsedFilters = typeof campaign.CustomerFilters === 'string'
            ? JSON.parse(campaign.CustomerFilters)
            : campaign.CustomerFilters;
          setCustomerFilters(parsedFilters);
        } catch (error) {
          console.error('Error parsing CustomerFilters:', error);
        }
      }

      // Pre-fill audience
      if (campaign.audienceData && Array.isArray(campaign.audienceData)) {
        const formattedAudience = campaign.audienceData.map(item => ({
          customerId: item.CustomerId,
          CustomerPhone: item.PhoneNo,
          CountryCode: '91',
          FirstName: item.FirstName,
          LastName: item.LastName,
          Source: item.Source
        }));
        setAudience(formattedAudience);
        setAudienceGridData(campaign.audienceData);
        setDataSource(campaign.audienceData[0]?.Source || 'optigo');
      }

      // Pre-fill template data
      if (campaign.templateData) {
        const template = campaign.templateData;
        const parsedComponents = typeof template.Components === 'string'
          ? JSON.parse(template.Components)
          : template.Components;

        setTemplateData({
          TemplateId: template.TemplateId,
          WabaTemplateId: template.WabaTemplateId,
          TemplateName: template.TemplateName,
          Components: parsedComponents,
          Type: template.Type,
          Channel: template.Channel
        });
        setMessageConfigured(true);
      }

      // Clear session storage drafts
      sessionStorage.removeItem('audienceSelectionDraft');
      sessionStorage.removeItem('campaignStepperState');
    }
  }, [location.state]);

  const handleRetargetStatusChange = (newStatus) => {
    if (!newStatus) return;
    setRetargetStatus(newStatus);
    setCampaignName(buildRetargetName(retargetSourceCampaignName, newStatus));
  };

  // Clear session storage drafts when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('audienceSelectionDraft');
      sessionStorage.removeItem('campaignStepperState');
    };
  }, []);

  // Recurrence state
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(dayjs());
  const [recurrenceTermination, setRecurrenceTermination] = useState('noEndDate');
  const [recurrenceEndAfter, setRecurrenceEndAfter] = useState(4);
  const [recurrenceEndBy, setRecurrenceEndBy] = useState(null);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('weekly');
  const [recurrenceDays, setRecurrenceDays] = useState(['Tuesday']);
  const [recurrenceTime, setRecurrenceTime] = useState(dayjs().hour(12).minute(0));
  const [recurrenceMonthlyDay, setRecurrenceMonthlyDay] = useState(14);
  const [recurrenceYearlyMonth, setRecurrenceYearlyMonth] = useState('May');
  const [recurrenceYearlyDay, setRecurrenceYearlyDay] = useState(14);

  const handleNext = () => { if (currentStep < 4) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const customerJson = audience.map(item => {
        const customerId = item.customerId ?? '';
        const countryCode = item.CountryCode || item.countryCode || '91';
        const customerPhone = item.CustomerPhone || item.PhoneNo || item.phone;
        const fullPhoneNo = normalizePhoneNumber(customerPhone, countryCode) || '';

        return {
          Source: dataSource,
          CustomerId: customerId,
          PhoneNo: fullPhoneNo
        };
      });

      let templateJson = [];
      if (templateData) {
        const components = templateData.Components || [];
        const variables = templateData.variables || {};

        // Check if any variable has a non-empty value
        const hasFilledVariables = Object.values(variables).some(val => val && val.trim() !== '');

        if (hasFilledVariables && components.length > 0) {
          // Replace VARIABLE_TEXT placeholders with actual variable values
          const processedComponents = components.map(component => {
            if (component.type === 'BODY' && component.text) {
              const parameters = [];
              const matches = component.text.match(/\{\{\d+\}\}/g);
              if (matches) {
                matches.forEach((match, index) => {
                  const varNum = index + 1;
                  const varValue = variables[varNum] || '';
                  parameters.push({
                    type: 'text',
                    text: varValue
                  });
                });
              }
              return {
                type: component.type,
                parameters: parameters
              };
            }
            // For non-BODY components (HEADER, FOOTER, BUTTONS), include as-is
            return component;
          });

          templateJson = [{
            TemplateId: templateData.TemplateId || 1,
            WabaTemplateId: templateData.WabaTemplateId || templateData.id,
            Components: processedComponents
          }];
        } else {
          // No variables filled, send blank array for Components
          templateJson = [{
            TemplateId: templateData.TemplateId || 1,
            WabaTemplateId: templateData.WabaTemplateId || templateData.id,
          }];
        }
      }
      const campaignData = {
        campaignName,
        wabaNumber: userToken?.whatsappNumber ?? '',
        templateJson,
        broadcastCampType: campaignType === 'immediate' ? 1 : 2,
        scheduleTime: scheduledFor ? scheduledFor.format('YYYY-MM-DD HH:mm:ss') : '',
        userId: userToken?.id ?? '',
        customerJson,
        customerFilters: customerFilters,
        campaignId: campaignId
      };
      const response = await createCampaign(campaignData);
      if (response.success) {
        if (response.data?.rd && response.data.rd.length > 0) {
          const rd = response.data.rd[0];
          if (rd.stat === 0) {
            console.error('Campaign creation failed:', rd.stat_msg);
            toast.error(`Campaign creation failed: ${rd.stat_msg?.replace(/"/g, '')}`);
            return;
          }
        }
        navigate('/campaigns');
        sessionStorage.removeItem('audienceSelectionDraft');
        sessionStorage.removeItem('campaignStepperState');
      } else {
        console.error('Campaign creation failed:', response.error);
        toast.error('Failed to create campaign. Please try again.');
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('An error occurred while creating the campaign. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepClick = (step, errorField = null) => {
    setShowError(!!errorField);
    if (errorField === 'campaignName') {
      setCampaignNameError(true);
      setAudienceError(false);
      setMessageError(false);
    } else if (errorField === 'audience') {
      setCampaignNameError(false);
      setAudienceError(true);
      setMessageError(false);
    } else if (errorField === 'message') {
      setCampaignNameError(false);
      setAudienceError(false);
      setMessageError(true);
    } else {
      setCampaignNameError(false);
      setAudienceError(false);
      setMessageError(false);
    }
    setCurrentStep(step);
  };

  const handleNavigate = () => {
    navigate('/campaigns');
    sessionStorage.removeItem('audienceSelectionDraft');
    sessionStorage.removeItem('campaignStepperState');
  };

  return (
    <div className={styles.page}>

      {/* ── Page Header ── */}
      <div className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={handleNavigate}>
            <ArrowLeft size={16} />
          </button>
          <div className={styles.headerIconWrap}>
            <Megaphone size={18} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Campaign</h1>
            <p className={styles.pageSubtitle}>
              <span>{isRetargetFlow && `Retarget from: ${retargetSourceCampaignName || '—'}  || `}</span> {campaignName?.trim() ? campaignName : 'New campaign'}
            </p>
          </div>
        </div>

        {/* Step progress pills */}
        <div className={styles.stepProgress}>
          {STEPS.map((s, i) => {
            const done = currentStep > s.step;
            const active = currentStep === s.step;
            return (
              <React.Fragment key={s.id}>
                <button
                  className={`${styles.stepPill} ${active ? styles.stepPillActive : ''} ${done ? styles.stepPillDone : ''}`}
                  onClick={() => handleStepClick(s.step)}
                >
                  <span className={styles.stepPillNum}>{done ? '✓' : s.step}</span>
                  <span className={styles.stepPillLabel}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`${styles.stepConnector} ${done ? styles.stepConnectorDone : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className={styles.mainContent}>

        {/* Left Sidebar */}
        <div className={styles.leftSidebar}>
          <div className={styles.stepperCard}>
            <div className={styles.stepperMenu}>
              {STEPS.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.menuItem} ${currentStep === item.step ? styles.active : ''} ${currentStep > item.step ? styles.done : ''}`}
                  onClick={() => handleStepClick(item.step)}
                >
                  <div className={styles.menuStepBadge}>
                    {currentStep > item.step ? '✓' : item.step}
                  </div>
                  <item.icon size={16} className={styles.menuIcon} />
                  <span className={styles.menuLabel}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* <button className={styles.addMessageButton} disabled>
              <Plus size={16} />
              Add Message
            </button> */}
          </div>
        </div>

        {/* Right Content */}
        <div className={styles.rightContent}>
          {currentStep === 1 && (
            <CampaignDetails
              campaignName={campaignName}
              setCampaignName={setCampaignName}
              campaignType={campaignType}
              setCampaignType={setCampaignType}
              repeat={repeat}
              setRepeat={setRepeat}
              onNext={handleNext}
              scheduledFor={scheduledFor}
              setScheduledFor={setScheduledFor}
              recurrenceStartDate={recurrenceStartDate}
              setRecurrenceStartDate={setRecurrenceStartDate}
              recurrenceTermination={recurrenceTermination}
              setRecurrenceTermination={setRecurrenceTermination}
              recurrenceEndAfter={recurrenceEndAfter}
              setRecurrenceEndAfter={setRecurrenceEndAfter}
              recurrenceEndBy={recurrenceEndBy}
              setRecurrenceEndBy={setRecurrenceEndBy}
              recurrenceFrequency={recurrenceFrequency}
              setRecurrenceFrequency={setRecurrenceFrequency}
              recurrenceDays={recurrenceDays}
              setRecurrenceDays={setRecurrenceDays}
              recurrenceTime={recurrenceTime}
              setRecurrenceTime={setRecurrenceTime}
              recurrenceMonthlyDay={recurrenceMonthlyDay}
              setRecurrenceMonthlyDay={setRecurrenceMonthlyDay}
              recurrenceYearlyMonth={recurrenceYearlyMonth}
              setRecurrenceYearlyMonth={setRecurrenceYearlyMonth}
              recurrenceYearlyDay={recurrenceYearlyDay}
              setRecurrenceYearlyDay={setRecurrenceYearlyDay}
              showError={showError}
              campaignNameError={campaignNameError}
              setCampaignNameError={setCampaignNameError}
            />
          )}
          {currentStep === 2 && (
            <Audience
              onNext={handleNext}
              onBack={handleBack}
              onAudienceChange={setAudience}
              onDataSourceChange={setDataSource}
              onFilterChange={setCustomerFilters}
              showError={showError}
              audienceError={audienceError}
              customerFilters={customerFilters}
              audienceData={audience}
              audienceGridData={audienceGridData}
              isEditClone={!!location.state?.campaign}
              campaignId={campaignId}
              isRetargetFlow={isRetargetFlow}
              retargetSourceCampaignName={retargetSourceCampaignName}
              retargetStatus={retargetStatus}
              retargetStatusOptions={RETARGET_STATUS_OPTIONS}
              onRetargetStatusChange={handleRetargetStatusChange}
              retargetSourceCampaignId={retargetSourceCampaignId}
              retargetChatMsgStatus={retargetChatMsgStatusId}
            />
          )}
          {currentStep === 3 && (
            <Message onNext={handleNext} onBack={handleBack} onMessageConfigured={setMessageConfigured} onTemplateData={setTemplateData} showError={showError} messageError={messageError} />
          )}
          {currentStep === 4 && (
            <PreviewSave
              onBack={handleBack}
              onSave={handleSave}
              campaignName={campaignName}
              campaignType={campaignType}
              scheduledFor={scheduledFor}
              audience={audience}
              dataSource={dataSource}
              repeat={repeat}
              recurrenceFrequency={recurrenceFrequency}
              messageConfigured={messageConfigured}
              onNavigateToStep={handleStepClick}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div >
  );
};

export default AddCampaign;
