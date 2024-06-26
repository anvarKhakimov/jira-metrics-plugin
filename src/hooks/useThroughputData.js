import { useState, useEffect } from 'react';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';
import { getCompletedTasks, prepareThroughputData } from '../utils/utils';

export default function useThroughputData(boardConfig, cfdData, updateUserFilters) {
  const { timeframeFrom, timeframeTo, resolution, activeColumns, allColumns } = useGlobalSettings();

  const [tasks, setTasks] = useState({});
  const [throughputData, setThroughputData] = useState([]);

  // @todo
  useEffect(() => {
    if (cfdData && cfdData.columns && cfdData.columns.length > 0) {
      const tasksData = {};

      // Построение структуры данных для каждой задачи
      Object.entries(cfdData.columnChanges).forEach(([timestamp, changes]) => {
        changes.forEach((change) => {
          if (!tasksData[change.key]) {
            tasksData[change.key] = {
              key: change.key,
              starts: {},
              ends: {},
            };
          }

          if (change.columnFrom !== undefined) {
            if (!tasksData[change.key].ends[change.columnFrom]) {
              tasksData[change.key].ends[change.columnFrom] = [];
            }
            tasksData[change.key].ends[change.columnFrom].push(timestamp);
          }

          if (change.columnTo !== undefined) {
            if (!tasksData[change.key].starts[change.columnTo]) {
              tasksData[change.key].starts[change.columnTo] = [];
            }
            tasksData[change.key].starts[change.columnTo].push(timestamp);
          }
        });
      });

      console.log('tasks:', tasksData);
      setTasks(tasksData);
    }
  }, [cfdData]);

  useEffect(() => {
    if (cfdData && cfdData.columns && cfdData.columns.length > 0) {
      const lastColumnIndex = cfdData.columns.length - 1;

      const completedTasks = getCompletedTasks(
        tasks,
        activeColumns,
        allColumns,
        timeframeFrom,
        timeframeTo
      );
      console.log('completedTasks:', completedTasks);

      const throughputData = prepareThroughputData(
        completedTasks,
        timeframeFrom,
        timeframeTo,
        resolution,
        'jira-domain',
        activeColumns,
        allColumns
      );
      console.log('throughputData:', throughputData);

      setThroughputData(throughputData);
    }
  }, [cfdData, tasks, timeframeFrom, timeframeTo, resolution, activeColumns]);

  return { throughputData };
}
