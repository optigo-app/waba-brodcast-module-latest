import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Check, Send } from 'lucide-react';
import StepperNavigation from './NavigationStepper/StepperNavigation';
import './ScheduleDate.scss';

const ScheduleDate = ({ sendDate, sendTime, distributeDays, onSendDateChange, onSendTimeChange, onDistributeDaysChange, onNext, onPrevious, prevDisabled, nextDisabled, currentStep, steps }) => {
    const [sendOption, setSendOption] = useState('now'); // 'now' or 'schedule'
    const [scheduleTime, setScheduleTime] = useState({
        date: sendDate || new Date().toISOString().split('T')[0],
        hours: sendTime?.split(':')[0] || '',
        minutes: '00',
    });
    const [distributeAudience, setDistributeAudience] = useState(false);
    const [distributionDays, setDistributionDays] = useState(distributeDays || 1);

    useEffect(() => {
        if (sendDate && sendDate !== scheduleTime.date) {
            setScheduleTime((prev) => ({ ...prev, date: sendDate }));
        }
    }, [sendDate]);

    useEffect(() => {
        if (sendOption === 'now') {
            // Clear time-related states when switching to 'now'
            setScheduleTime(prev => ({
                ...prev,
                hours: '',
                minutes: '00'
            }));
            setDistributeAudience(false);
            setDistributionDays(1);
        } else {
            // When switching to 'schedule', set default time if not set
            if (!scheduleTime.hours) {
                const now = new Date();
                setScheduleTime(prev => ({
                    ...prev,
                    hours: String(now.getHours()).padStart(2, '0'),
                    minutes: String(now.getMinutes()).padStart(2, '0')
                }));
            }
        }
    }, [sendOption]);

    useEffect(() => {
        if (onSendDateChange) onSendDateChange(scheduleTime.date);

        if (sendOption === 'schedule') {
            if (onSendTimeChange && scheduleTime.hours) {
                onSendTimeChange(`${scheduleTime.hours}:00`);
            }
            if (onDistributeDaysChange) {
                onDistributeDaysChange(distributeAudience ? distributionDays : '');
            }
        } else {
            if (onSendTimeChange) onSendTimeChange('');
            if (onDistributeDaysChange) onDistributeDaysChange('');
        }
    }, [scheduleTime, distributeAudience, distributionDays, sendOption, onSendDateChange, onSendTimeChange, onDistributeDaysChange]);

    const handleTimeChange = (field, value) => {
        setScheduleTime(prev => ({ ...prev, [field]: value }));
    };

    // Get current date and time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isToday = scheduleTime.date === now.toISOString().split('T')[0];

    // Generate hours array with disabled state for past hours if today
    const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = String(i).padStart(2, '0');
        const isPastHour = isToday && i < currentHour;
        return { value: hour, disabled: isPastHour };
    });
    const distributionOptions = [
        { label: '1 Day', days: 1 },
        { label: '2 Days', days: 2 },
        { label: '3 Days', days: 3 },
        { label: '4 Days', days: 4 },
        { label: '5 Days', days: 5 },
        { label: '6 Days', days: 6 },
        { label: '1 Week', days: 7 },
        { label: '2 Weeks', days: 14 },
        { label: '3 Weeks', days: 21 },
        { label: '4 Weeks', days: 28 }
    ];

    return (
        <>
            <div className="home_main_section">
                <div className="step-card">
                    <div className="step-header">
                        <div className="step-icon">
                            <span>{currentStep}</span>
                        </div>
                        <h2>Set a send date</h2>
                    </div>
                </div>

                {/* Send Date Options */}
                <div className="schedule-settings">

                    {/* Send Now Option */}
                    <div
                        className={`schedule-option ${sendOption === 'now' ? 'active' : ''}`}
                        onClick={() => setSendOption('now')}
                    >
                        <div className="schedule-option-content">
                            <div className="schedule-option-main">
                                <div className={`schedule-radio ${sendOption === 'now' ? 'active' : ''}`}>
                                    {sendOption === 'now' && <Check className="schedule-radio-check" />}
                                </div>
                                <div>
                                    <div className="schedule-option-title">Send Now</div>
                                    <div className="schedule-option-subtitle">You can send message right now</div>
                                </div>
                            </div>
                            {sendOption === 'now' && <Check className="schedule-option-status-icon" />}
                        </div>
                    </div>

                    {/* Schedule Option - Disabled with Coming Soon badge */}
                    <div
                        className="schedule-option coming-soon"
                    >
                        <div className="schedule-option-content">
                            <div className="schedule-option-main">
                                <div className="schedule-radio">
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="schedule-option-title">Schedule</div>
                                        <span className="coming-soon-badge">Coming soon</span>
                                    </div>
                                    <div className="schedule-option-subtitle">Schedule your campaign for a later date</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <StepperNavigation
                onNext={onNext}
                onPrevious={onPrevious}
                prevDisabled={prevDisabled}
                nextDisabled={nextDisabled}
                currentStep={currentStep}
                steps={steps}
            />
        </>
    )
}

export default ScheduleDate