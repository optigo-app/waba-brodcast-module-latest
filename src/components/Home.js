import './style.scss';
import ChannelSelector from './ChannelSelector';
import MessageComposer from './MessageComposer/MessageComposer';
import ProgressSteps from './ProgressSteps';
import AudienceSection from './Audience/AudienceSection';
import ScheduleDate from './ScheduleDate';
import LaunchCampaign from './LaunchCampaign';
import StepperNavigation from './NavigationStepper/StepperNavigation';
import { useStepper } from '../context/StepperContext';
import { useLocation, useNavigate } from 'react-router-dom';

const Home = ({ userToken }) => {
    const {
        currentStep,
        steps,
        selectedChannel,
        message,
        selectedTemplate,
        sendDate,
        sendTime,
        sendOption,
        distributeDays,
        audience,
        setSendTime,
        setSendOption,
        setDistributeDays,
        marketingSettings,
        utmParameters,
        conversionGoal,
        setCurrentStep,
        setSelectedChannel,
        setMessage,
        setSelectedTemplate,
        setSendDate,
        setAudience,
        setDatasource,
        setMarketingSettings,
        setUtmParameters,
        setConversionGoal,
        goNext,
        goPrev,
    } = useStepper();

    const navigate = useNavigate();
    const location = useLocation();

    const token = userToken;

    const handleNext = () => {
        goNext();
    };

    const handleBack = () => {
        goPrev();
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <div className="home_main_section">
                        </div>

                        <StepperNavigation
                            onNext={handleNext}
                            onPrevious={handleBack}
                            prevDisabled={currentStep === 1}
                            nextDisabled={currentStep === steps.length}
                            currentStep={currentStep}
                            steps={steps}
                        />
                    </>
                );
            case 2:
                return (
                    <>
                        <div className="home_main_section">
                            <MessageComposer
                                message={message}
                                onMessageChange={setMessage}
                                currentStep={currentStep}
                                selectedTemplate={selectedTemplate}
                                onTemplateSelect={setSelectedTemplate}
                            />
                        </div>
                        <StepperNavigation
                            onNext={handleNext}
                            onPrevious={handleBack}
                            prevDisabled={currentStep === 1}
                            nextDisabled={currentStep === steps.length}
                            currentStep={currentStep}
                            steps={steps}
                        />
                    </>
                );
            case 3:
                return (
                    <AudienceSection
                        audience={audience}
                        onAudienceChange={setAudience}
                        onDataSourceChange={setDatasource}
                        onNext={handleNext}
                        onPrevious={handleBack}
                        currentStep={currentStep}
                        steps={steps}
                    />
                );
            case 4:
                return (
                    <ScheduleDate
                        sendDate={sendDate}
                        sendTime={sendTime}
                        sendOption={sendOption}
                        distributeDays={distributeDays}
                        onSendDateChange={setSendDate}
                        onSendTimeChange={setSendTime}
                        onSendOptionChange={setSendOption}
                        onDistributeDaysChange={setDistributeDays}
                        onNext={handleNext}
                        onPrevious={handleBack}
                        prevDisabled={currentStep === 1}
                        nextDisabled={currentStep === steps.length}
                        currentStep={currentStep}
                        steps={steps}
                    />
                );
            case 5:
                return (
                    <LaunchCampaign
                        onNext={handleNext}
                        onPrevious={handleBack}
                        prevDisabled={currentStep === 1}
                        nextDisabled={currentStep === steps.length}
                        currentStep={currentStep}
                        steps={steps}
                    />
                );
            default:
                return null;
        }
    };


    return (
        <div className="home_root">
            {/* Main Content */}
            <div className="home_stepper_main_section">
                <div className="progress_stepper_section">
                    <ProgressSteps
                        currentStep={currentStep}
                        steps={steps}
                        onStepClick={(step) => setCurrentStep(step)}
                    />
                </div>
                <div className="home_main_section-div" style={{ marginTop: "2rem" }}>
                    {renderStepContent()}
                </div>
            </div>
        </div>
    )
}

export default Home
