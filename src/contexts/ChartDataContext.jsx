import React, { createContext, useContext } from 'react';
import useChartData from '../hooks/useChartData';
import useThroughputData from '../hooks/useThroughputData';

const ChartDataContext = createContext();

export function ChartDataProvider({ boardConfig, cfdData, updateUserFilters, children }) {
  const chartData = useChartData(boardConfig, cfdData, updateUserFilters);
  const throughputData = useThroughputData(boardConfig, cfdData, updateUserFilters);

  return (
    <ChartDataContext.Provider
      value={{ ...chartData, throughputData: throughputData.throughputData }}
    >
      {children}
    </ChartDataContext.Provider>
  );
}

export const useChartDataContext = () => useContext(ChartDataContext);
