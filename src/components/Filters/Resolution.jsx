import React from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { sendAnalyticsEvent } from "../../utils/google-analytics";

function Resolution({ setResolution, resolution }) {
  const handleResolutionChange = (event) => {
    const newResolution = event.target.value;
    setResolution(newResolution);

    sendAnalyticsEvent("resolution_interacted", {
      action: "Select",
      label: "Resolution Selected",
      value: newResolution,
    });
  };

  return (
    <FormControl sx={{ width: "200px" }}>
      <InputLabel id="resolution-label">Resolution</InputLabel>
      <Select
        labelId="resolution-label"
        id="resolution-select"
        value={resolution}
        label="Resolution"
        onChange={handleResolutionChange}
      >
        <MenuItem value="day">Day</MenuItem>
        <MenuItem value="week">Week</MenuItem>
        <MenuItem value="two-weeks">Two Weeks</MenuItem>
        <MenuItem value="month">Month</MenuItem>
      </Select>
    </FormControl>
  );
}

export default Resolution;
