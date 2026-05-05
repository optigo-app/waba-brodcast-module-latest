import { useState } from 'react';
import StepperNavigation from './NavigationStepper/StepperNavigation';
import { sendBulk } from '../API/SendBullk/SendBulk';
import toast from 'react-hot-toast';
import { useAuthToken } from '../hooks/useAuthToken';
import { useConfetti } from '../hooks/Canfetti';
import { useStepper } from '../context/StepperContext';
import Lottie from 'lottie-react';
import LottieAnim from '../assets/lotties/launch_qualibrate.json';
import { SetScheduler } from '../API/Scheduler/Scheduler';
import './LaunchCampaign.scss';

const LaunchCampaign = ({
    onNext,
    onPrevious,
    prevDisabled,
    nextDisabled,
    currentStep,
    steps
}) => {

    const getSelectedData =
        JSON.parse(sessionStorage.getItem("campaignStepperState")) || [];

    const { userToken } = useAuthToken();
    const { triggerConfetti } = useConfetti();
    const { reset } = useStepper();

    const [loading, setLoading] = useState(false);

const handleLaunchCampaign = async () => {
    try {
        setLoading(true);
        const {
            selectedTemplates = [],
            audience = [],
            datasource: dataSource,
            sendDate,
            sendTime,
            sendOption = "now"
        } = getSelectedData || {};

        if (!selectedTemplates.length || !audience.length) {
            toast.error("Missing templates or audience data!");
            return;
        }

        const campaignId = selectedTemplates[0]?.campaignId;
        const templates = [...new Set(selectedTemplates.map(t => t?.Id))];

        const customers = audience.map(a => ({
            customerId: a?.customerId,
            phoneNo: a?.phone,
        }));

        const payload = {
            userId: userToken?.userId,
            campaignId,
            templates,
            dataSource,
            customers,
        };

        const isLiveSend = sendOption === "now";
        let apiResponse;

        if (isLiveSend) {
            apiResponse = await sendBulk(payload);
        } else {
            if (!sendDate || !sendTime) {
                toast.error("Schedule date & time required!");
                return;
            }

            apiResponse = await SetScheduler(
                userToken?.userId,
                campaignId,
                templates,
                dataSource,
                JSON.stringify(customers),
                `${sendDate} ${sendTime}`
            );
        }
        const isSuccess =
            apiResponse?.success ||
            apiResponse?.data?.stat === 1;

        if (isSuccess) {
            toast.success("Campaign launched successfully!");
            triggerConfetti();

            sessionStorage.removeItem("campaignStepperState");
            sessionStorage.removeItem("savedTemplate");

            reset?.(); // safe call
        } else {
            toast.error(
                apiResponse?.data?.message ||
                apiResponse?.data?.stat_msg ||
                "Failed to launch campaign. Please try again."
            );
        }

    } catch (error) {
        console.error("❌ Error launching campaign:", error);
        toast.error("Failed to launch campaign. Check console.");
    } finally {
        setLoading(false);
    }
};

    return (
        <div className={loading ? 'launch-root launch-root--loading' : 'launch-root'}>

            {/* ✅ Overlay Loader */}
            {loading && (
                <div className="launch-overlay">
                    <div className="launch-overlay-content">

                        <Lottie
                            animationData={LottieAnim}
                            loop
                            autoplay
                            style={{ width: '500px', height: '500px' }}
                        />

                        <p className="launch-overlay-text">
                            Launching your campaign...
                        </p>

                        <p className="launch-overlay-subtext">
                            Please wait while we set everything live
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="launch-card-content">
                <div className="launch-message-box">
                    <p className="launch-main-text">
                        Everything looks great!
                    </p>

                    <p className="launch-sub-text">
                        Your campaign is ready to reach its audience.
                        Review your settings one last time before going live.
                    </p>
                </div>

                <button
                    className="launch-button launch-action-button"
                    onClick={handleLaunchCampaign}
                    disabled={loading}
                >
                    {loading ? 'Launching...' : 'Launch Campaign'}
                </button>
            </div>

            {/* Stepper */}
            <StepperNavigation
                onNext={onNext}
                onPrevious={onPrevious}
                prevDisabled={prevDisabled}
                nextDisabled={nextDisabled}
                currentStep={currentStep}
                steps={steps}
            />

        </div>
    );
};

export default LaunchCampaign;