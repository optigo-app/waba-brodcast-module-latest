import React, { useState } from 'react';
import { Info, Plus, User, MessageSquare, FileText, Send, Megaphone, ArrowLeft } from 'lucide-react';
import { TextField, FormControlLabel, Checkbox, Button, Typography, Paper } from '@mui/material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import styles from './AddCampaign.module.scss';
import CampaignDetails from './Steps/CampaignDetails';
import Audience from './Steps/Audience';
import Message from './Steps/Message';
import PreviewSave from './Steps/PreviewSave';

const STEPS = [
  { id: 'details',  label: 'Campaign Details', icon: FileText,    step: 1 },
  { id: 'audience', label: 'Audience',          icon: User,        step: 2 },
  { id: 'message',  label: 'Message',           icon: MessageSquare, step: 3 },
  { id: 'preview',  label: 'Preview & Save',    icon: Send,        step: 4 },
];

const AddCampaign = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignType, setCampaignType] = useState('immediate');
  const [repeat, setRepeat] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignNameError, setCampaignNameError] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(null);
  const [audience, setAudience] = useState([]);
  const [dataSource, setDataSource] = useState('optigo');
  const [messageConfigured, setMessageConfigured] = useState(false);

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
  const handleSave = () => { console.log('Save & Launch campaign'); };
  const handleStepClick = (step) => { setCurrentStep(step); };

  return (
    <div className={styles.page}>

      {/* ── Page Header ── */}
      <div className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/campaigns')}>
            <ArrowLeft size={16} />
          </button>
          <div className={styles.headerIconWrap}>
            <Megaphone size={18} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Campaign</h1>
            <p className={styles.pageSubtitle}>
              {campaignName?.trim() ? campaignName : 'New campaign'}
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

            <button className={styles.addMessageButton}>
              <Plus size={16} />
              Add Message
            </button>

            <div className={styles.infoCard}>
              <div className={styles.infoCardContent}>
                <Info size={14} className={styles.infoIcon} />
                <span className={styles.infoText}>Total Receivers: 2158</span>
              </div>
            </div>
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
            />
          )}
          {currentStep === 2 && (
            <Audience onNext={handleNext} onBack={handleBack} onAudienceChange={setAudience} onDataSourceChange={setDataSource} />
          )}
          {currentStep === 3 && (
            <Message onNext={handleNext} onBack={handleBack} onMessageConfigured={setMessageConfigured} />
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCampaign;
