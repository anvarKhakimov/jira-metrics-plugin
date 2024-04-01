import { useMemo } from 'react';

const useTasksInLastColumn = (cfdData, selectedColumns, displayedTasks) => {
  const filteredTasks = useMemo(() => {
    const lastSelectedColumnName = selectedColumns[selectedColumns.length - 1];
    const lastSelectedColumnIndex = cfdData.columns.findIndex(
      (col) => col.name === lastSelectedColumnName
    );

    return Object.entries(displayedTasks).reduce((acc, [taskId, task]) => {
      if (task.durations && task.durations.hasOwnProperty(lastSelectedColumnIndex)) {
        acc[taskId] = task;
      }
      return acc;
    }, {});
  }, [cfdData.columns, selectedColumns, displayedTasks]);

  return filteredTasks;
};

export default useTasksInLastColumn;
