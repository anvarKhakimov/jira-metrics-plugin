// useAgingData
import { useMemo } from 'react';
import { convertTimeToResolution, calculateLeadTime, isTaskInCurrentColumn } from '../utils/utils';

const useAgingData = (
  cfdData,
  activeColumns, // Изменим название аргумента на activeColumns
  tasks,
  timeframeFrom,
  timeframeTo,
  completionCriteria
) => {
  const agingData = useMemo(() => {
    // Изменяем логику для работы с activeColumns, которые уже содержат индексы
    const activeColumnIndices = activeColumns.map((column) => column.index);

    return activeColumns // Используем activeColumns вместо фильтрации cfdData.columns
      .map((activeColumn, index) => {
        let taskDots = [];

        // Проверяем, является ли текущая колонка последней
        if (completionCriteria === 'last' && index === activeColumns.length - 1) {
          // Если это последняя колонка и Completion Criteria = Last Column, не отображаем задачи
          taskDots = [];
        } else {
          taskDots = Object.values(tasks)
            .map((task) => ({
              ...task,
              leadTime: calculateLeadTime(task, activeColumnIndices), // Расчёт leadTime с использованием индексов из activeColumns
            }))
            .filter((task) => isTaskInCurrentColumn(task, activeColumn.index, cfdData.columns))
            .map((task) => {
              const agingTime = convertTimeToResolution(task.leadTime, 'day');
              return {
                x: index,
                y: agingTime,
                taskKey: task.key,
                agingTime,
              };
            });
        }

        const groupedTaskDots = taskDots.reduce((acc, dot) => {
          const existingGroup = acc.find((group) => Math.abs(group.y - dot.y) <= 5);
          if (existingGroup) {
            existingGroup.taskCount++;
            existingGroup.tasks.push({ taskKey: dot.taskKey, agingTime: dot.agingTime });
          } else {
            acc.push({
              ...dot,
              taskCount: 1,
              tasks: [{ taskKey: dot.taskKey, agingTime: dot.agingTime }],
            });
          }
          return acc;
        }, []);

        return {
          name: activeColumn.name,
          data: groupedTaskDots,
        };
      });
  }, [cfdData.columns, activeColumns, tasks, timeframeFrom, timeframeTo, completionCriteria]);

  return agingData;
};

export default useAgingData;
