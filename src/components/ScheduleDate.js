import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import StepperNavigation from "./NavigationStepper/StepperNavigation";
import "./ScheduleDate.scss";

const ScheduleDate = ({
  sendDate,
  sendTime,
  sendOption,
  distributeDays,
  onSendDateChange,
  onSendTimeChange,
  onSendOptionChange,
  onDistributeDaysChange,
  onNext,
  onPrevious,
  prevDisabled,
  nextDisabled,
  currentStep,
  steps,
}) => {
  const [localSendOption, setLocalSendOption] = useState(sendOption || "now");

  const [scheduleTime, setScheduleTime] = useState({
    date: sendDate || new Date().toISOString().split("T")[0],
    hour12: "",
    period: "AM",
  });

  const [distributeAudience, setDistributeAudience] = useState(false);
  const [distributionDays, setDistributionDays] = useState(distributeDays || 1);

  /* ---------------- Convert 24h → 12h ---------------- */
  const convertTo12Hour = (hour24) => {
    const h = parseInt(hour24, 10);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return { hour12: String(hour12).padStart(2, "0"), period };
  };

  const convertTo24Hour = (hour12, period) => {
    let h = parseInt(hour12, 10);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return String(h).padStart(2, "0");
  };

  /* ---------------- Sync initial time ---------------- */
  useEffect(() => {
    if (sendTime) {
      const { hour12, period } = convertTo12Hour(sendTime.split(":")[0]);
      setScheduleTime((prev) => ({ ...prev, hour12, period }));
    }
  }, [sendTime]);

  /* ---------------- Sync sendOption with prop ---------------- */
  useEffect(() => {
    if (sendOption !== undefined) {
      setLocalSendOption(sendOption);
    }
  }, [sendOption]);

  /* ---------------- Handle option switch ---------------- */
  useEffect(() => {
    if (localSendOption === "now") {
      setScheduleTime((prev) => ({
        ...prev,
        hour12: "",
        period: "AM",
      }));
      setDistributeAudience(false);
      setDistributionDays(1);
    } else {
      if (!scheduleTime.hour12) {
        const now = new Date();
        const { hour12, period } = convertTo12Hour(now.getHours());
        setScheduleTime((prev) => ({ ...prev, hour12, period }));
      }
    }
  }, [localSendOption]);

  /* ---------------- Emit values ---------------- */
  useEffect(() => {
    if (onSendDateChange) onSendDateChange(scheduleTime.date);

    if (localSendOption === "schedule" && scheduleTime.hour12) {
      const hour24 = convertTo24Hour(scheduleTime.hour12, scheduleTime.period);
      onSendTimeChange(`${hour24}:00`);
      onDistributeDaysChange(distributeAudience ? distributionDays : "");
    } else {
      onSendTimeChange("");
      onDistributeDaysChange("");
    }
  }, [scheduleTime, distributeAudience, distributionDays, localSendOption]);

  const handleChange = (field, value) => {
    setScheduleTime((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------------- Hour Options (12h) ---------------- */
  const hours12 = Array.from({ length: 12 }, (_, i) => {
    const val = String(i + 1).padStart(2, "0");
    return val;
  });

  return (
    <>
      <div className="home_main_section">
        <div className="schedule-settings">

          {/* Send Now */}
          <div
            className={`schedule-option ${localSendOption === "now" ? "active" : ""}`}
            onClick={() => {
              setLocalSendOption("now");
              if (onSendOptionChange) onSendOptionChange("now");
            }}
          >
            <div className="schedule-option-content">
              <div className="schedule-option-main">
                <div className={`schedule-radio ${localSendOption === "now" ? "active" : ""}`}>
                  {localSendOption === "now" && <Check className="schedule-radio-check" />}
                </div>
                <div>
                  <div className="schedule-option-title">Send Now</div>
                  <div className="schedule-option-subtitle">Send immediately</div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div
            className={`schedule-option ${localSendOption === "schedule" ? "active" : ""}`}
            onClick={() => {
              setLocalSendOption("schedule");
              if (onSendOptionChange) onSendOptionChange("schedule");
            }}
          >
            <div className="schedule-option-content">
              <div className="schedule-option-main">
                <div className={`schedule-radio ${localSendOption === "schedule" ? "active" : ""}`}>
                  {localSendOption === "schedule" && <Check className="schedule-radio-check" />}
                </div>
                <div>
                  <div className="schedule-option-title">Schedule</div>
                  <div className="schedule-option-subtitle">Send later</div>
                </div>
              </div>
            </div>

            {localSendOption === "schedule" && (
              <div className="schedule-details">

                <div className="schedule-row">

                  {/* Date */}
                  <div className="schedule-field">
                    <label className="schedule-label">Date</label>
                    <input
                      type="date"
                      className="schedule-input"
                      value={scheduleTime.date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => handleChange("date", e.target.value)}
                    />
                  </div>

                  {/* Hour */}
                  <div className="schedule-field">
                    <label className="schedule-label">Hour</label>
                    <select
                      className="schedule-input"
                      value={scheduleTime.hour12}
                      onChange={(e) => handleChange("hour12", e.target.value)}
                    >
                      {hours12.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* AM/PM */}
                  <div className="schedule-field">
                    <label className="schedule-label">Period</label>
                    <select
                      className="schedule-input"
                      value={scheduleTime.period}
                      onChange={(e) => handleChange("period", e.target.value)}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <StepperNavigation {...{ onNext, onPrevious, prevDisabled, nextDisabled, currentStep, steps }} />
    </>
  );
};

export default ScheduleDate;