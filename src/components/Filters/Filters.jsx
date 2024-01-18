import React from "react";
import Box from "@mui/material/Box";
import Resolution from "./Resolution";
import TimeframePicker from "./TimeframePicker";
import SelectColumns from "./SelectColumns";
import SelectSwimlanes from "./SelectSwimlanes";
import FilterButton from "./FilterButton";

function Filters({
  selectedColumns,
  setSelectedColumns,
  columns,
  timeframeFrom,
  setTimeframeFrom,
  timeframeTo,
  setTimeframeTo,
  allFilters,
  activeFilters,
  toggleFilter,
  allSwimlanes,
  activeSwimlanes,
  updateActiveSwimlanes,
  resolution,
  setResolution,
  showResolution = true,
  showTimeframe = true,
  showSwimlanes = true,
  showColumns = true,
  showFilters = true,
}) {
  return (
    <div>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="start"
        flexWrap="wrap"
      >
        {showResolution && (
          <Resolution setResolution={setResolution} resolution={resolution} />
        )}

        {showTimeframe && (
          <TimeframePicker
            timeframeFrom={timeframeFrom}
            setTimeframeFrom={setTimeframeFrom}
            timeframeTo={timeframeTo}
            setTimeframeTo={setTimeframeTo}
          />
        )}

        {showSwimlanes && (
          <SelectSwimlanes
            allSwimlanes={allSwimlanes}
            activeSwimlanes={activeSwimlanes}
            updateActiveSwimlanes={updateActiveSwimlanes}
          />
        )}

        {showColumns && (
          <SelectColumns
            selectedColumns={selectedColumns}
            setSelectedColumns={setSelectedColumns}
            columns={columns}
          />
        )}
      </Box>

      {showFilters && (
        <Box>
          <div className="filters-wrapper">
            {allFilters.map((filter) => (
              <FilterButton
                key={filter.id}
                filter={filter}
                isActive={activeFilters.includes(filter.id)}
                toggleFilter={toggleFilter}
              />
            ))}
          </div>
        </Box>
      )}
    </div>
  );
}

export default Filters;
