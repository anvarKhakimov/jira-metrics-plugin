import React from 'react';

function ReportTable({ histogramData }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Interval</th>
          <th>Number of Tasks</th>
          <th>Completed Tasks</th>
        </tr>
      </thead>
      <tbody>
        {histogramData.map((item) => (
          <tr key={item.interval}>
            <td>{item.interval}</td>
            <td>{item.count}</td>
            <td>
              {item.taskLinks &&
                item.taskLinks.map((link, index) => (
                  <React.Fragment key={link}>
                    {index > 0 ? ', ' : ''}
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      {item.tasks[index]}
                    </a>
                  </React.Fragment>
                ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ReportTable;
