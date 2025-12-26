import { useState } from 'react'
import StepperNavigation from './NavigationStepper/StepperNavigation'
import { sendBulk } from '../API/SendBullk/SendBulk';
import toast from 'react-hot-toast';
import { useAuthToken } from '../hooks/useAuthToken';
import { useConfetti } from '../hooks/Canfetti';
import Lottie from 'lottie-react';
import LottieAnim from '../assets/lotties/launch_qualibrate.json';
import { SetScheduler } from '../API/Scheduler/Scheduler';
import './LaunchCampaign.scss';

const LaunchCampaign = ({ onNext, onPrevious, prevDisabled, nextDisabled, currentStep, steps }) => {
    const getSelectedData = JSON.parse(sessionStorage.getItem("campaignStepperState")) || [];
    const { userToken } = useAuthToken();
    const { triggerConfetti } = useConfetti();
    const [loading, setLoading] = useState(false);

    const handleLaunchCampaign = async () => {
        try {
            setLoading(true);

            const selectedTemplates = getSelectedData?.selectedTemplates || [];
            const audience = getSelectedData?.audience || [];

            if (!selectedTemplates.length || !audience.length) {
                toast.error("Missing templates or audience data!");
                setLoading(false);
                return;
            }

            const dataSource = getSelectedData?.datasource;
            const customers = audience.map((a) => ({
                customerId: a?.customerId,
                phoneNo: a?.phone,
            }));
            const sendDate = getSelectedData?.sendDate;
            const sendTime = getSelectedData?.sendTime;
            const distributeDays = getSelectedData?.distributeDays;

            const templates = selectedTemplates.map((t) => t?.Id);

            const payload = {
                userId: userToken?.userId,
                campaignId: selectedTemplates[0]?.campaignId,
                templates,
                dataSource,
                customers,
            };

            let response1;

            if (!!distributeDays && !!sendTime) {
                response1 = await SetScheduler(userToken?.userId, selectedTemplates[0]?.campaignId, Array.from(new Set(templates)), dataSource, JSON.stringify(customers), sendDate + ' ' + sendTime, distributeDays || 1);
            }
            const response = await sendBulk(payload);

            if (response1?.data?.stat === 1 && response?.data?.success) {

                toast.success("Campaign launched successfully!");
                triggerConfetti();

                sessionStorage.removeItem("campaignStepperState");

            } else {
                toast.error(
                    response?.data?.message || "Failed to launch campaign. Please try again."
                );
            }
        } catch (error) {
            console.error("❌ Error launching campaign:", error);
            toast.error("Failed to launch campaign. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={loading ? 'launch-root launch-root--loading' : 'launch-root'}>
                {loading && (
                    <div className="launch-overlay">
                        <div className="launch-overlay-content">
                            <Lottie
                                animationData={LottieAnim}
                                loop={true}
                                style={{ width: '120px', height: '120px', pointerEvents: 'none' }}
                            />
                            <p className="launch-overlay-text">Launching your campaign...</p>
                            <p className="launch-overlay-subtext">Please wait while we set everything live</p>
                        </div>
                    </div>
                )}

                <div className="home_main_section">
                    <div className="step-card">
                        <div className="step-header">
                            <div className="step-icon">
                                <span>{currentStep}</span>
                            </div>
                            <h2 className="step-title">Set live</h2>
                        </div>
                    </div>
                </div>
                <div className="launch-card-content">
                    <div className="launch-message-box">
                        <p className="launch-main-text">Everything looks great!</p>
                        <p className="launch-sub-text">Your campaign is ready to reach its audience. Review your settings one last time before going live.</p>
                    </div>
                    <button
                        className="launch-button launch-action-button"
                        onClick={handleLaunchCampaign}
                        disabled={loading}
                    >
                        {loading ? 'Launching...' : 'Launch Campaign'}
                    </button>
                </div>

                <StepperNavigation
                    onNext={onNext}
                    onPrevious={onPrevious}
                    prevDisabled={prevDisabled}
                    nextDisabled={nextDisabled}
                    currentStep={currentStep}
                    steps={steps}
                />
            </div>
        </>
    )
}

export default LaunchCampaign
