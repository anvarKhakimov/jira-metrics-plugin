import React from 'react';
import Box from '@mui/material/Box';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';
import Resolution from './Resolution';
import TimeframePicker from './TimeframePicker';
import SelectColumns from './SelectColumns';
import SelectSwimlanes from './SelectSwimlanes';
import FilterButton from './FilterButton';

function Filters({
  showResolution = true,
  showTimeframe = true,
  showSwimlanes = true,
  showColumns = true,
  showFilters = true,
}) {
  const {
    selectedTimeframe,
    setSelectedTimeframe,
    timeframeFrom,
    setTimeframeFrom,
    timeframeTo,
    setTimeframeTo,
  } = useGlobalSettings();

  const { cfdData, allSwimlanes, activeSwimlanes, updateActiveSwimlanes } = useJiraDataContext();

  const {
    selectedColumns,
    setSelectedColumns,
    allFilters,
    activeFilters,
    toggleFilter,
    resolution,
    setResolution,
  } = useChartDataContext();

  const columns = cfdData ? cfdData.columns : [];

  return (
    <div>
      <Box display="flex" alignItems="center" justifyContent="start" flexWrap="wrap">
        {showResolution && <Resolution setResolution={setResolution} resolution={resolution} />}

        {showTimeframe && (
          <TimeframePicker
            timeframeFrom={timeframeFrom}
            setTimeframeFrom={setTimeframeFrom}
            timeframeTo={timeframeTo}
            setTimeframeTo={setTimeframeTo}
            selectedTimeframe={selectedTimeframe}
            setSelectedTimeframe={setSelectedTimeframe}
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
