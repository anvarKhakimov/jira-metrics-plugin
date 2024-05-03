import React from 'react';

function ReportTable({ histogramData, jiraBaseUrl }) {
  const jiraDomain = new URL(jiraBaseUrl).origin;

  // Сортировка данных по убыванию лидтайма
  const sortedData = [...histogramData].sort((a, b) => b.leadTime - a.leadTime);

  return (
    <table>
      <thead>
        <tr>
          <th>Cycle Time</th>
          <th>Number of Issues</th>
          <th>Backlog Issues</th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item) => (
          <tr key={item.leadTime}>
            <td>{item.leadTime}</td>
            <td>{item.count}</td>
            <td>
              {item.tasks.map((task, taskIndex) => (
                <React.Fragment key={task}>
                  {taskIndex > 0 ? ', ' : ''}
                  <a
                    href={`${jiraDomain}/browse/${task}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {task}
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
