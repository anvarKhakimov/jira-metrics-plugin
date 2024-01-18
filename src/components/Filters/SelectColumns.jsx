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

function SelectColumns({ selectedColumns, setSelectedColumns, columns }) {
  const handleColumnChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedColumns(typeof value === "string" ? value.split(",") : value);

    sendAnalyticsEvent("column_interacted", {
      action: "Select",
      label: "Column Selected",
    });
  };

  return (
    <FormControl sx={{ m: 1, width: 300 }}>
      <InputLabel id="select-columns-label">Select Columns</InputLabel>
      <Select
        labelId="select-columns-label"
        id="select-columns"
        multiple
        value={selectedColumns}
        onChange={handleColumnChange}
        input={<OutlinedInput label="Select Columns" />}
        renderValue={(selected) => selected.join(", ")}
      >
        {columns.map((column) => (
          <MenuItem key={column.name} value={column.name}>
            <Checkbox checked={selectedColumns.indexOf(column.name) > -1} />
            <ListItemText primary={column.name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default SelectColumns;
