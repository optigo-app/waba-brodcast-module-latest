import React, { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { TextField, Typography, Chip, Checkbox, FormControlLabel, Button, Radio, RadioGroup, Box, MenuItem, Select } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker, DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import styles from '../AddCampaign.module.scss';

const CampaignDetails = ({
  campaignName,
  setCampaignName,
  campaignType,
  setCampaignType,
  repeat,
  setRepeat,
  onNext,
  scheduledFor,
  setScheduledFor,
  recurrenceStartDate,
  setRecurrenceStartDate,
  recurrenceTermination,
  setRecurrenceTermination,
  recurrenceEndAfter,
  setRecurrenceEndAfter,
  recurrenceEndBy,
  setRecurrenceEndBy,
  recurrenceFrequency,
  setRecurrenceFrequency,
  recurrenceDays,
  setRecurrenceDays,
  recurrenceTime,
  setRecurrenceTime,
  recurrenceMonthlyDay,
  setRecurrenceMonthlyDay,
  recurrenceYearlyMonth,
  setRecurrenceYearlyMonth,
  recurrenceYearlyDay,
  setRecurrenceYearlyDay
}) => {
  const [nameError, setNameError] = useState(false);

  const handleNextClick = () => {
    if (!campaignName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    onNext();
  };
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Calculate upcoming events based on recurrence settings
  const upcomingEvents = useMemo(() => {
    if (!repeat) return [];

    const events = [];
    let currentDate = recurrenceStartDate.clone();
    currentDate = currentDate.hour(recurrenceTime.hour()).minute(recurrenceTime.minute());

    for (let i = 0; i < 5; i++) {
      if (recurrenceFrequency === 'daily') {
        currentDate = currentDate.add(1, 'day');
      } else if (recurrenceFrequency === 'weekly') {
        const currentDayIndex = currentDate.day();
        const nextDayIndex = daysOfWeek.findIndex(day => day === recurrenceDays[0]);
        const daysToAdd = (nextDayIndex - currentDayIndex + 7) % 7 || 7;
        currentDate = currentDate.add(daysToAdd, 'day');
      } else if (recurrenceFrequency === 'monthly') {
        currentDate = currentDate.add(1, 'month');
        currentDate = currentDate.date(recurrenceMonthlyDay);
      } else if (recurrenceFrequency === 'yearly') {
        currentDate = currentDate.add(1, 'year');
        const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(recurrenceYearlyMonth);
        currentDate = currentDate.month(monthIndex).date(recurrenceYearlyDay);
      }

      // Check termination conditions
      if (recurrenceTermination === 'endAfter' && events.length >= recurrenceEndAfter) {
        break;
      }
      if (recurrenceTermination === 'endBy' && recurrenceEndBy && currentDate.isAfter(recurrenceEndBy)) {
        break;
      }

      events.push(currentDate.clone());
    }

    return events;
  }, [repeat, recurrenceStartDate, recurrenceFrequency, recurrenceDays, recurrenceTime, recurrenceTermination, recurrenceEndAfter, recurrenceEndBy, recurrenceMonthlyDay, recurrenceYearlyMonth, recurrenceYearlyDay]);
  return (
    <div className={styles.formCard}>
      {/* Campaign Name */}
      <div className={styles.formField}>
        <label className={styles.label}>Campaign Name *</label>
        <TextField
          fullWidth
          placeholder="Enter Campaign Name"
          value={campaignName}
          onChange={(e) => {
            setCampaignName(e.target.value);
            setNameError(false);
          }}
          variant="outlined"
          size="small"
          className={styles.textField}
          error={nameError}
          helperText={nameError ? 'Campaign name is required' : ''}
        />
      </div>

      {/* Campaign Type */}
      <div className={styles.formField}>
        <label className={styles.label}>Campaign Type</label>
        <div className={styles.chipGroup}>
          <Chip
            label="Immediate"
            onClick={() => setCampaignType('immediate')}
            className={`${styles.chipButton} ${campaignType === 'immediate' ? styles.active : ''}`}
          />
          <Chip
            label="Schedule"
            onClick={() => setCampaignType('schedule')}
            className={`${styles.chipButton} ${campaignType === 'schedule' ? styles.active : ''}`}
          />
        </div>
      </div>

      {/* Info Alert Box */}
      {campaignType === 'immediate' && (
        <div className={styles.infoAlert}>
          <Info size={18} className={styles.alertIcon} />
          <div className={styles.alertContent}>
            <Typography variant="body2" className={styles.alertMessage}>
              Immediate is used to trigger campaign immediately without any time delay. Once you trigger a campaign, your messages will start sending within 1 minute.
            </Typography>
          </div>
        </div>
      )}

      {/* Schedule For */}
      {campaignType === 'schedule' && (
        <div className={styles.formField}>
          <label className={styles.label}>Schedule For</label>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              value={scheduledFor}
              onChange={(newValue) => setScheduledFor(newValue)}
              views={['year', 'month', 'day', 'hours']}
              ampm={true}
              format="DD/MM/YYYY hh A"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  className: styles.textField
                }
              }}
            />
          </LocalizationProvider>
        </div>
      )}

      {/* Repeat Option */}
      <div className={styles.formField}>
        <FormControlLabel
          control={
            <Checkbox
              checked={repeat}
              onChange={(e) => setRepeat(e.target.checked)}
              className={styles.checkbox}
            />
          }
          label="Repeat"
          className={styles.checkboxLabel}
        />
      </div>

      {/* Recurrence Configuration */}
      {repeat && (
        <div className={styles.recurrenceSection}>
          {/* Range of Recurrence */}
          <div className={styles.recurrenceSectionTitle}>Range of Recurrence</div>

          <div className={styles.recurrenceRangeRow}>
            <div className={styles.recurrenceRangeField}>
              <label className={styles.label}>Start Date</label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={recurrenceStartDate}
                  onChange={(newValue) => setRecurrenceStartDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      className: styles.textField
                    }
                  }}
                />
              </LocalizationProvider>
            </div>

            <div className={styles.recurrenceRangeField}>
              <label className={styles.label}>Termination</label>
              <RadioGroup
                value={recurrenceTermination}
                onChange={(e) => setRecurrenceTermination(e.target.value)}
                className={styles.radioGroupInline}
              >
                <FormControlLabel
                  value="noEndDate"
                  control={<Radio />}
                  label="No end date"
                  className={styles.radioLabel}
                />
                <FormControlLabel
                  value="endAfter"
                  control={<Radio />}
                  label="End after"
                  className={styles.radioLabel}
                />
                <FormControlLabel
                  value="endBy"
                  control={<Radio />}
                  label="End by"
                  className={styles.radioLabel}
                />
              </RadioGroup>
            </div>
          </div>

          {recurrenceTermination === 'endAfter' && (
            <div className={styles.formField}>
              <label className={styles.label}>Occurrences</label>
              <TextField
                fullWidth
                type="number"
                value={recurrenceEndAfter}
                onChange={(e) => setRecurrenceEndAfter(parseInt(e.target.value))}
                variant="outlined"
                size="small"
                className={styles.textField}
              />
            </div>
          )}

          {recurrenceTermination === 'endBy' && (
            <div className={styles.formField}>
              <label className={styles.label}>End Date</label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={recurrenceEndBy}
                  onChange={(newValue) => setRecurrenceEndBy(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      className: styles.textField
                    }
                  }}
                />
              </LocalizationProvider>
            </div>
          )}

          {/* Recurrence Pattern */}
          <div className={styles.recurrencePatternBox}>
            <div className={styles.recurrenceSectionTitle}>Recurrence Pattern</div>

            <div className={styles.formField}>
              <label className={styles.label}>Frequency</label>
              <div className={styles.chipGroup}>
                <Chip
                  label="Daily"
                  onClick={() => setRecurrenceFrequency('daily')}
                  className={`${styles.chipButton} ${recurrenceFrequency === 'daily' ? styles.active : ''}`}
                />
                <Chip
                  label="Weekly"
                  onClick={() => setRecurrenceFrequency('weekly')}
                  className={`${styles.chipButton} ${recurrenceFrequency === 'weekly' ? styles.active : ''}`}
                />
                <Chip
                  label="Monthly"
                  onClick={() => setRecurrenceFrequency('monthly')}
                  className={`${styles.chipButton} ${recurrenceFrequency === 'monthly' ? styles.active : ''}`}
                />
                <Chip
                  label="Yearly"
                  onClick={() => setRecurrenceFrequency('yearly')}
                  className={`${styles.chipButton} ${recurrenceFrequency === 'yearly' ? styles.active : ''}`}
                />
              </div>
            </div>

            {recurrenceFrequency === 'weekly' && (
              <div className={styles.formField}>
                <label className={styles.label}>Select Days</label>
                <div className={styles.daysPicker}>
                  {daysOfWeek.map((day) => (
                    <div key={day} className={styles.dayCheckboxWrapper}>
                      <Checkbox
                        checked={recurrenceDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRecurrenceDays([...recurrenceDays, day]);
                          } else {
                            setRecurrenceDays(recurrenceDays.filter(d => d !== day));
                          }
                        }}
                        className={styles.checkbox}
                      />
                      <span className={styles.dayLabel}>{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recurrenceFrequency === 'monthly' && (
              <div className={styles.formField}>
                <label className={styles.label}>Select Day of Month</label>
                <Select
                  value={recurrenceMonthlyDay}
                  onChange={(e) => setRecurrenceMonthlyDay(e.target.value)}
                  className={styles.textField}
                  size="small"
                  fullWidth
                >
                  {daysOfMonth.map((day) => (
                    <MenuItem key={day} value={day}>
                      {day}
                    </MenuItem>
                  ))}
                </Select>
              </div>
            )}

            {recurrenceFrequency === 'yearly' && (
              <div className={styles.recurrenceYearlyRow}>
                <div className={styles.formField}>
                  <label className={styles.label}>Select Month</label>
                  <Select
                    value={recurrenceYearlyMonth}
                    onChange={(e) => setRecurrenceYearlyMonth(e.target.value)}
                    className={styles.textField}
                    size="small"
                    fullWidth
                  >
                    {monthsOfYear.map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Select Day</label>
                  <Select
                    value={recurrenceYearlyDay}
                    onChange={(e) => setRecurrenceYearlyDay(e.target.value)}
                    className={styles.textField}
                    size="small"
                    fullWidth
                  >
                    {daysOfMonth.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            <div className={styles.formField}>
              <label className={styles.label}>Recurrence Time</label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  value={recurrenceTime}
                  onChange={(newValue) => setRecurrenceTime(newValue)}
                  views={['hours']}
                  ampm={true}
                  format="hh A"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      className: styles.textField
                    }
                  }}
                />
              </LocalizationProvider>
            </div>
          </div>

          {/* Dynamic Preview */}
          <div className={styles.recurrenceSectionTitle}>Upcoming Events</div>
          <div className={styles.upcomingEvents}>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => (
                <div key={index} className={styles.eventItem}>
                  <Typography variant="body2" className={styles.eventDate}>
                    {event.format('DD MMM YYYY')} at {event.format('hh:mm A')}
                  </Typography>
                </div>
              ))
            ) : (
              <Typography variant="body2" className={styles.noEvents}>
                No upcoming events
              </Typography>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className={styles.formActions}>
        <div/>
        <Button className='buttonClassname' onClick={handleNextClick}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default CampaignDetails;
