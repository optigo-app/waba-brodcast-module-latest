import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";

const ProgressSteps = ({ currentStep, steps, onStepClick }) => {
    const progressRefs = useRef([]);

    useEffect(() => {
        // Trigger animation when currentStep changes
        const animateProgress = () => {
            progressRefs.current.forEach((ref, index) => {
                if (ref) {
                    const isCompleted = index < currentStep - 1;
                    ref.style.transition = 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)';
                    ref.style.width = isCompleted ? '100%' : '0%';
                }
            });
        };

        const timer = setTimeout(animateProgress, 100);
        return () => clearTimeout(timer);
    }, [currentStep]);

    return (
        <div className="progress-steps-main">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCurrent = stepNumber === currentStep;
                const wasCompleted = stepNumber <= currentStep;

                return (
                    <React.Fragment key={index}>
                        {/* Step Circle */}
                        <div className="step-container">
                            <div
                                className={`step-circle ${isCurrent ? 'current' : ''} ${wasCompleted ? 'completed' : ''}`}
                                onClick={() => onStepClick(stepNumber)}
                            >
                                <span className="step-number">
                                    {wasCompleted ? <Check className="check-icon" /> : stepNumber}
                                </span>
                            </div>

                            <span
                                className={`step-label ${isCurrent ? 'current' : wasCompleted ? 'completed' : 'pending'}`}
                            >
                                {step}
                            </span>
                        </div>

                        {/* Progress Line */}
                        {index < steps.length - 1 && (
                            <div className="progress-line">
                                <div
                                    ref={el => (progressRefs.current[index] = el)}
                                    className="progress-fill"
                                    style={{
                                        transitionDelay: `${index * 100}ms`,
                                    }}
                                />
                            </div>
                        )}
                    </React.Fragment>

                );
            })}
        </div>
    );
};

export default ProgressSteps;
