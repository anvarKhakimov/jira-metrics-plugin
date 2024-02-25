import React, { useState } from 'react';

import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { sendAnalyticsEvent } from '../../utils/google-analytics';

function TimeframePicker({
  timeframeFrom,
  setTimeframeFrom,
  timeframeTo,
  setTimeframeTo,
  settings,
  updateSettings,
}) {
  //const [selectedTimeframe, setSelectedTimeframe] = useState('custom');
  const selectedTimeframe = settings.selectedTimeframe || 'default';

  const updateDateFields = (timeframe) => {
    const today = new Date();
    let newFrom;

    switch (timeframe) {
      case 'past_week':
        newFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        break;
      case 'past_2_weeks':
        newFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
        break;
      case 'past_month':
        newFrom = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        break;
      case 'past_3_months':
        newFrom = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        break;
      case 'past_6_months':
        newFrom = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        break;
      case 'all_time':
        // Set to a significantly old date or handle differently based on your logic
        newFrom = new Date(2000, 0, 1);
        break;
      case 'custom':
        return; // Do not change dates when custom is selected
      default:
        return;
    }

    const newTo = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    setTimeframeFrom(newFrom.toISOString().split('T')[0]);
    setTimeframeTo(newTo.toISOString().split('T')[0]);
  };

  const handleTimeframeSelection = (event) => {
    const newTimeframe = event.target.value;
    updateSettings({ selectedTimeframe: newTimeframe });
    updateDateFields(newTimeframe);

    sendAnalyticsEvent('timeframe_interacted', {
      action: 'Select',
      label: 'Timeframe Selected',
      value: newTimeframe,
    });
  };

  const handleTimeframeFromChange = (event) => {
    const newTimeframeFrom = event.target.value;
    setTimeframeFrom(newTimeframeFrom);
    setSelectedTimeframe('custom');
    updateSettings({ selectedTimeframe: 'custom' });

    sendAnalyticsEvent('timeframe_interacted', {
      action: 'Change',
      label: 'Timeframe From Changed',
    });
  };

  const handleTimeframeToChange = (event) => {
    const newTimeframeTo = event.target.value;
    setTimeframeTo(newTimeframeTo);
    updateSettings({ selectedTimeframe: 'custom' });

    sendAnalyticsEvent('timeframe_interacted', {
      action: 'Change',
      label: 'Timeframe To Changed',
    });
  };

  const handleKeyDown = (e) => {
    e.preventDefault();
  };

  return (
    <>
      <FormControl sx={{ marginX: 1, minWidth: 120 }}>
        <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
        <Select
          labelId="timeframe-select-label"
          id="timeframe-select"
          value={selectedTimeframe}
          label="Timeframe"
          onChange={handleTimeframeSelection}
        >
          <MenuItem value="past_week">Past Week</MenuItem>
          <MenuItem value="past_2_weeks">Past 2 Weeks</MenuItem>
          <MenuItem value="past_month">Past Month</MenuItem>
          <MenuItem value="past_3_months">Past 3 Months</MenuItem>
          <MenuItem value="past_6_months">Past 6 Months</MenuItem>
          <MenuItem value="all_time">All Time</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="From"
        type="date"
        value={timeframeFrom}
        onChange={handleTimeframeFromChange}
        onKeyDown={handleKeyDown}
        InputLabelProps={{ shrink: true }}
        sx={{ marginX: 1 }}
        inputProps={{ max: timeframeTo }}
      />
      <TextField
        label="To"
        type="date"
        value={timeframeTo}
        onChange={handleTimeframeToChange}
        onKeyDown={handleKeyDown}
        InputLabelProps={{ shrink: true }}
        sx={{ marginX: 1 }}
        inputProps={{ min: timeframeFrom }}
      />
    </>
  );
}

export default TimeframePicker;
