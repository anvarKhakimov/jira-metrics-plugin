import { useState, useEffect } from 'react';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';
import {
  prepareFilteredTasks,
  prepareHistogramArray,
  calculateTimeInColumns,
  debugLog,
} from '../utils/utils';

/**
 * useChartData - Хук для управления данными диаграммы времени выполнения задач.
 * Он обрабатывает исходные данные задач (cfdData) и конфигурацию доски (boardConfig),
 * управляет фильтрами и временным диапазоном для отображения данных,
 * а также поддерживает список выбранных колонок.
 *
 * @param {Object} boardConfig - Конфигурация доски, содержащая настройки фильтров и другую метаинформацию.
 * @param {Object} cfdData - Данные Cumulative Flow Diagram, включая изменения колонок и другие метрики.
 * @param {Function} updateUserFilters - Функция для обновления фильтров пользователя.
 */

export default function useChartData(boardConfig, cfdData, updateUserFilters) {
  const {
    timeframeFrom,
    timeframeTo,
    resolution,
    selectedColumns,
    setSelectedColumns,
    allColumns,
    activeColumns,
  } = useGlobalSettings();
  const [tasks, setTasks] = useState({});
  const [displayedTasks, setDisplayedTasks] = useState({});

  const [histogramData, setHistogramData] = useState([]);

  const currentDate = new Date();
  const lastMonthDate = new Date(currentDate);
  lastMonthDate.setMonth(currentDate.getMonth() - 1);

  const [isLoading, setIsLoading] = useState(false);

  // @TODO возможно стоит унести в JiraDataContext
  const [allFilters, setAllFilters] = useState([]);

  // @TODO лишний параметр
  const [activeFilters, setActiveFilters] = useState([]);

  // Переключение активности фильтров
  const toggleFilter = (filterId) => {
    if (activeFilters.includes(filterId)) {
      const newFilters = activeFilters.filter((id) => id !== filterId);
      setActiveFilters(newFilters);
      updateUserFilters(newFilters);
    } else {
      const newFilters = [...activeFilters, filterId];
      setActiveFilters(newFilters);
      updateUserFilters(newFilters);
    }
  };

  /**
   * Этот useEffect отвечает за инициализацию задач и колонок на основе данных CFD.
   * Сначала он проверяет, доступны ли данные в cfdData, особенно колонки, и если да, то начинает обработку данных.
   * В первую очередь, если выбранные колонки еще не были установлены, он их инициализирует.
   * Далее, для каждого изменения в колонках, строим структуры данных для каждой задачи,
   * включая время начала и окончания задачи в каждой колонке.
   * После этого, для каждой задачи рассчитывается общая продолжительность ее нахождения в каждой колонке.
   * Наконец, обновляется состояние компонента новыми данными о задачах и выбранными колонками,
   * а также устанавливаются фильтры из конфигурации доски, если они доступны.
   */

  useEffect(() => {
    // Логика обработки данных cfdData для построения структуры задач
    debugLog('useChartData: Task & Column Initialization Hook');
    if (cfdData && cfdData.columns && cfdData.columns.length > 0) {
      const tasksData = {};
      const now = new Date().getTime();
      const lastColumnIndexString = String(cfdData.columns.length - 1);

      // Обновление selectedColumns, если они еще не были установлены
      if (selectedColumns.length === 0) {
        setSelectedColumns(cfdData.columns.map((column) => column.name));
      }

      // Проход по всем изменениям колонок и построение структуры данных для каждой задачи.
      Object.entries(cfdData.columnChanges).forEach(([timestamp, changes]) => {
        changes.forEach((change) => {
          // Если это первое изменение для этой задачи, инициализируем её структуру.
          if (!tasksData[change.key]) {
            tasksData[change.key] = {
              key: change.key,
              starts: {},
              ends: {},
            };
          }

          // Если задача была перемещена из колонки, добавляем этот момент времени к массиву 'ends'.
          if (change.columnFrom !== undefined) {
            if (!tasksData[change.key].ends[change.columnFrom]) {
              tasksData[change.key].ends[change.columnFrom] = [];
            }
            tasksData[change.key].ends[change.columnFrom].push(timestamp);
          }

          // Если задача была перемещена в колонку, добавляем этот момент времени к массиву 'starts'.
          if (change.columnTo !== undefined) {
            if (!tasksData[change.key].starts[change.columnTo]) {
              tasksData[change.key].starts[change.columnTo] = [];
            }
            tasksData[change.key].starts[change.columnTo].push(timestamp);
          }
        });
      });

      // Расчет общей продолжительности нахождения задачи в каждой колонке с учетом новой логики
      Object.values(tasksData).forEach((task) => {
        task.timeInColumns = calculateTimeInColumns(task, cfdData.columns, now);

        task.durations = {};
        Object.entries(task.starts).forEach(([column, startTimes]) => {
          const endTimes = task.ends[column] || [];

          let totalDuration = 0;
          startTimes.forEach((startTime, index) => {
            let endTime = endTimes[index] || now;

            // Для последней колонки проверяем, есть ли фактическое время окончания
            if (column === lastColumnIndexString) {
              // Если это последняя запись в startTimes и нет соответствующего endTime (переход в другую колонку),
              // не учитываем это время как часть durations для последней колонки
              if (index === startTimes.length - 1 && !endTimes[index]) {
                endTime = startTime; // Это исключает последний период из подсчета
              }
            }

            totalDuration += endTime - startTime;
          });

          if (totalDuration > 0) {
            task.durations[column] = totalDuration;
          }
        });
      });

      // Обновляем состояние компонента с новыми данными о задачах и выбранными колонками.
      setTasks(tasksData);

      // Установка фильтров из boardConfig
      if (boardConfig.quickFilterConfig && boardConfig.quickFilterConfig.quickFilters.length > 0) {
        setAllFilters(boardConfig.quickFilterConfig.quickFilters);
      }
    }
  }, [cfdData, boardConfig, resolution]);

  useEffect(() => {
    setIsLoading(true);

    if (cfdData && cfdData.columns && cfdData.columns.length > 0) {
      const filteredTasks = prepareFilteredTasks(
        tasks,
        cfdData.columns,
        selectedColumns,
        timeframeFrom,
        timeframeTo
      );

      const histogramArray = prepareHistogramArray(filteredTasks, resolution);

      setDisplayedTasks(filteredTasks);
      setHistogramData(histogramArray);
      setIsLoading(false);
    }
  }, [cfdData, tasks, timeframeFrom, timeframeTo, selectedColumns, resolution]);

  useEffect(() => {
    window.debugData = {
      boardConfig,
      cfdData,
      tasks,
      displayedTasks,
      histogramData,
      selectedColumns,
      timeframeFrom,
      timeframeTo,
      isLoading,
      allFilters,
      activeFilters,
      resolution,
      allColumns,
      activeColumns,
    };
  }, [
    boardConfig,
    cfdData,
    tasks,
    displayedTasks,
    histogramData,
    selectedColumns,
    timeframeFrom,
    timeframeTo,
    isLoading,
    allFilters,
    activeFilters,
    resolution,
    allColumns,
    activeColumns,
  ]);

  return {
    tasks,
    displayedTasks,
    histogramData,
    selectedColumns,
    setSelectedColumns,
    isLoading,
    allFilters,
    toggleFilter,
  };
}
