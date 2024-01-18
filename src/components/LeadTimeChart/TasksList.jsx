import React from "react";
import { durationToReadableFormat } from "../../utils/utils";

function TasksList({ displayedTasks, cfdData, selectedColumns }) {
  if (!displayedTasks || Object.keys(displayedTasks).length === 0)
    return <p>No tasks available.</p>;

  return (
    <div>
      <h3>Tasks List</h3>
      <ul>
        {Object.entries(displayedTasks).map(([taskKey, taskDetails]) => {
          // Вычисляем общий лидтайм для задачи только по выбранным колонкам
          const taskLeadTime = selectedColumns.reduce((total, column) => {
            const columnIndex = cfdData.columns.findIndex(
              (col) => col.name === column
            );
            return total + (taskDetails.durations[columnIndex] || 0);
          }, 0);

          return (
            <li key={taskKey}>
              <strong>{taskKey}</strong> (Lead Time: {Math.round(taskLeadTime)}{" "}
              days)
              <ul>
                {cfdData.columns.map((column) => {
                  if (selectedColumns.includes(column.name)) {
                    // Находим индекс колонки для получения продолжительности задачи в этой колонке
                    const columnIndex = cfdData.columns.findIndex(
                      (col) => col.name === column.name
                    );
                    const columnDuration =
                      taskDetails.durations[columnIndex] || 0;
                    return (
                      <li key={column.name}>
                        {column.name}:{" "}
                        {durationToReadableFormat(columnDuration)}
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default TasksList;
