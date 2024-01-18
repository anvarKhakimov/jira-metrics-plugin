import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import { sendAnalyticsEvent } from "../../utils/google-analytics";

function SelectSwimlanes({
  allSwimlanes,
  activeSwimlanes,
  updateActiveSwimlanes,
}) {
  const handleSwimlaneChange = (event) => {
    const {value} = event.target

    updateActiveSwimlanes(value)

    sendAnalyticsEvent("swimlane_interacted", {
      action: "Select",
      label: "Swimlane Selected",
    });
  };

  return (
    <FormControl sx={{ m: 1, width: 300 }}>
      <InputLabel id="select-swimlanes-label">Select Swimlanes</InputLabel>
      <Select
        labelId="select-swimlanes-label"
        id="select-swimlanes"
        multiple
        value={activeSwimlanes}
        onChange={handleSwimlaneChange}
        input={<OutlinedInput label="Select Swimlanes" />}
        renderValue={(selected) =>
          allSwimlanes
            .filter((swimlane) => selected.includes(swimlane.id))
            .map((swimlane) => swimlane.name)
            .join(", ")
        }
      >
        {allSwimlanes.map((swimlane) => (
          <MenuItem key={swimlane.id} value={swimlane.id}>
            <Checkbox checked={activeSwimlanes.includes(swimlane.id)} />
            <ListItemText primary={swimlane.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default SelectSwimlanes;
