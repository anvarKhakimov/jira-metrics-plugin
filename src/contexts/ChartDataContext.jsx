import React, { createContext, useContext } from 'react';
import useChartData from '../hooks/useChartData';

const ChartDataContext = createContext();

export function ChartDataProvider({
  boardConfig,
  cfdData,
  updateUserFilters,
  children,
}) {
  const chartData = useChartData(boardConfig, cfdData, updateUserFilters);

  return (
    <ChartDataContext.Provider value={chartData}>
      {children}
    </ChartDataContext.Provider>
  );
}

export const useChartDataContext = () => useContext(ChartDataContext);
