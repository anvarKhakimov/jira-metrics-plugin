import { useMemo } from 'react';
import { isTaskInCurrentColumn } from '../utils/utils'; // Убедитесь, что функция правильно импортирована

const useWipData = (cfdData, activeColumns, tasks, completionCriteria) => {
  const wipData = useMemo(
    () =>
      activeColumns.map((activeColumn, index) => {
        const taskDots = Object.values(tasks).filter((task) =>
          isTaskInCurrentColumn(task, activeColumn.index, cfdData.columns)
        );
        const isLastColumn = index === activeColumns.length - 1;

        let label = `WIP: ${taskDots.length}`;
        if (completionCriteria === 'last' && isLastColumn) {
          label = '';
        }

        return {
          x: index,
          y: 0,
          label,
        };
      }),
    [cfdData.columns, activeColumns, tasks, completionCriteria]
  );

  return wipData;
};

export default useWipData;
