import React from 'react';

function ColumnPercentilesDetails({ columnPercentiles }) {
  const msInDay = 86400000;
  return (
    <div>
      {columnPercentiles.map(
        ({ column, name, segments, taskDetails, sortedAccumulatedTimes }, columnIndex) => (
          <div key={columnIndex} style={{ marginBottom: '40px' }}>
            <h3>Column: {name}</h3>
            <h4>Tasks Details: ({taskDetails.length})</h4>
            <table>
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Total Time (days)</th>
                  {taskDetails.length > 0 &&
                    taskDetails[0].detailTimes.map(({ columnName }, index) => (
                      <th key={index}>{columnName} (days)</th> // Исправлено на (days)
                    ))}
                </tr>
              </thead>
              <tbody>
                {taskDetails.map(({ taskId, accumulatedTime, detailTimes }) => (
                  <tr key={taskId}>
                    <td>{taskId}</td>
                    <td>{accumulatedTime.toFixed(2)}</td>
                    {detailTimes.map(({ duration }, index) => (
                      <td key={index}>{duration / msInDay}</td> // Исправлено на вывод в днях
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <h4>
              Total Column Time:{' '}
              {taskDetails
                .reduce((acc, { accumulatedTime }) => acc + accumulatedTime, 0)
                .toFixed(2)}{' '}
              days
            </h4>
            <h4>Sorted Accumulated Times (days):</h4>
            <p>[{sortedAccumulatedTimes.map((time) => time).join(', ')}]</p>
            <h4>Percentiles:</h4>
            <table>
              <thead>
                <tr>
                  <th>Percentile</th>
                  <th>From (days)</th>
                  <th>To (days)</th>
                </tr>
              </thead>
              <tbody>
                {segments.map(({ from, to, percentile, color }, segmentIndex) => (
                  <tr key={segmentIndex} style={{ backgroundColor: color }}>
                    <td>{percentile}%</td>
                    <td>{from.toFixed(2)}</td>
                    <td>{to.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

export default ColumnPercentilesDetails;
