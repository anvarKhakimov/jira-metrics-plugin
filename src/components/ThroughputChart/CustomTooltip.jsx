import React from 'react';

const tooltipStyles = {
  padding: '10px',
  backgroundColor: 'white',
  opacity: '0.8',
  border: '1px solid #ccc',
  boxShadow: '0px 0px 1px rgba(0, 0, 0, 0.1)',
};

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { interval } = payload[0].payload;
    const { count } = payload[0].payload;

    return (
      <div className="custom-tooltip" style={tooltipStyles}>
        <p>{`Interval: ${interval}`}</p>
        <p>{`Tasks Completed: ${count}`}</p>
      </div>
    );
  }
  return null;
}

export default CustomTooltip;
