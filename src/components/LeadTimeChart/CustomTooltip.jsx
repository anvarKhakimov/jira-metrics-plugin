import React from "react";

function calculatePercentile(histogramData, currentDays) {
  const tasksBeforeCurrent = histogramData
    .filter((data) => data.leadTime <= currentDays)
    .reduce((total, data) => total + data.count, 0);

  const totalTasks = histogramData.reduce(
    (total, data) => total + data.count,
    0
  );

  return (tasksBeforeCurrent / totalTasks) * 100;
}

const tooltipStyles = {
  padding: "10px",
  backgroundColor: "white",
  opacity: "0.8",
  border: "1px solid #ccc",
  boxShadow: "0px 0px 1px rgba(0, 0, 0, 0.1)",
};

function CustomTooltip({ active, payload, histogramData }) {
  if (active && payload && payload.length) {
    const {days} = payload[0].payload;
    const {count} = payload[0].payload;
    const percentile = calculatePercentile(histogramData, days);

    return (
      <div className="custom-tooltip" style={tooltipStyles}>
        <p>{`LeadTime: ${days}`}</p>
        <p>{`Tasks: ${count}`}</p>
        <p>{`Percentile: ${percentile.toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
}

export default CustomTooltip;
