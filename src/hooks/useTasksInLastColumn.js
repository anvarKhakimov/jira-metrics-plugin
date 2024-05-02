import { useMemo } from 'react';
import { calculateLeadTime } from '../utils/utils';

const useTasksInLastColumn = (activeColumns, displayedTasks, completionCriteria) => {
  const filteredAndProcessedTasks = useMemo(() => {
    // Фильтрация задач в последней колонке, если completionCriteria === 'last'
    const tasksInLastColumn =
      completionCriteria === 'last'
        ? Object.entries(displayedTasks).reduce((acc, [taskId, task]) => {
            const lastActiveColumn = activeColumns[activeColumns.length - 1];
            const lastActiveColumnIndex = lastActiveColumn ? lastActiveColumn.index : -1;
            if (task.starts && task.starts[lastActiveColumnIndex]) {
              acc[taskId] = task;
            }
            return acc;
          }, {})
        : displayedTasks;

    // Расчет лидтайма для отфильтрованных задач, исключая последнюю колонку, если это указано
    if (completionCriteria === 'last') {
      const selectedColumnIndices = activeColumns.slice(0, -1).map((column) => column.index);
      return Object.entries(tasksInLastColumn).reduce((acc, [taskKey, taskDetails]) => {
        const leadTime = calculateLeadTime(taskDetails, selectedColumnIndices);
        acc[taskKey] = { ...taskDetails, leadTime };
        return acc;
      }, {});
    }

    return tasksInLastColumn;
  }, [activeColumns, displayedTasks, completionCriteria]);

  return filteredAndProcessedTasks;
};

export default useTasksInLastColumn;
