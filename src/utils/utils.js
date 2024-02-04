export const isDebug =
  process.env.NODE_ENV === 'development' ||
  new URLSearchParams(window.location.search).has('debug');

export function getColumnIndexByName(columns, columnName) {
  return columns.findIndex((column) => column.name === columnName);
}

export function convertTimeToResolution(timeInMilliseconds, resolution) {
  const timeInDays = timeInMilliseconds / 86400000; // Конвертация из миллисекунд в дни

  switch (resolution) {
    case 'week':
      return Math.ceil(timeInDays / 7);
    case 'two-weeks':
      return Math.ceil(timeInDays / 14);
    case 'month':
      return Math.ceil(timeInDays / 30);
    default:
      return Math.ceil(timeInDays); // По умолчанию время в днях
  }
}

/**
 * Преобразует количество миллисекунд в удобочитаемый текстовый формат, включая месяцы, недели, дни, часы, минуты и секунды.
 *
 * Функция преобразует входное количество миллисекунд в месяцы, недели, дни, часы, минуты и секунды,
 * округляя количество времени до ближайшего целого числа в соответствующих единицах.
 * Возвращает строку, представляющую продолжительность в формате
 * 'X months, Y weeks, Z days, A hours, B minutes, C seconds'. Если какой-либо компонент времени равен нулю или меньше, он опускается из результата.
 * Если входное значение равно нулю или меньше, возвращается строка "Less than a second".
 *
 * @param {number} milliseconds - Продолжительность в миллисекундах.
 * @returns {string} Продолжительность в удобочитаемом формате. Например, '1 month, 2 weeks, 3 days, 4 hours, 5 minutes, 6 seconds'.
 *
 * Примеры использования:
 * durationToReadableFormat(0); // Возвращает: 'Less than a second'
 * durationToReadableFormat(2592000000); // Возвращает: '1 month' (30 дней)
 * durationToReadableFormat(6480000000); // Возвращает: '2 months, 2 weeks, 3 days, 4 hours, 5 minutes, 6 seconds'
 */

export function durationToReadableFormat(milliseconds) {
  const DAYS_PER_WEEK = 7;
  const DAYS_PER_MONTH = 30; // Примерное значение
  const HOURS_PER_DAY = 24;
  const MINUTES_PER_HOUR = 60;
  const SECONDS_PER_MINUTE = 60;
  const MILLISECONDS_PER_SECOND = 1000;
  const MILLISECONDS_PER_MINUTE = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;
  const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * MINUTES_PER_HOUR;
  const MILLISECONDS_PER_DAY = MILLISECONDS_PER_HOUR * HOURS_PER_DAY;

  let remainingMilliseconds = milliseconds;

  const months = Math.floor(remainingMilliseconds / (DAYS_PER_MONTH * MILLISECONDS_PER_DAY));
  remainingMilliseconds -= months * DAYS_PER_MONTH * MILLISECONDS_PER_DAY;

  const weeks = Math.floor(remainingMilliseconds / (DAYS_PER_WEEK * MILLISECONDS_PER_DAY));
  remainingMilliseconds -= weeks * DAYS_PER_WEEK * MILLISECONDS_PER_DAY;

  const days = Math.floor(remainingMilliseconds / MILLISECONDS_PER_DAY);
  remainingMilliseconds -= days * MILLISECONDS_PER_DAY;

  const hours = Math.floor(remainingMilliseconds / MILLISECONDS_PER_HOUR);
  remainingMilliseconds -= hours * MILLISECONDS_PER_HOUR;

  const minutes = Math.floor(remainingMilliseconds / MILLISECONDS_PER_MINUTE);
  remainingMilliseconds -= minutes * MILLISECONDS_PER_MINUTE;

  const seconds = Math.floor(remainingMilliseconds / MILLISECONDS_PER_SECOND);

  const result = [];

  if (months) result.push(`${months} month${months > 1 ? 's' : ''}`);
  if (weeks) result.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
  if (days) result.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours) result.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes) result.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds) result.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

  if (result.length === 0) {
    result.push('Less than a second');
  }

  return result.join(', ');
}

/**
 * Рассчитывает данные для гистограммы, учитывая заданные параметры.
 *
 * @param {Object} tasks - Объект с информацией о задачах.
 * @param {string} timeframeFrom - Начальная дата временного интервала.
 * @param {string} timeframeTo - Конечная дата временного интервала.
 * @param {Array} selectedColumns - Массив выбранных колонок.
 * @param {string} resolution - Разрешение времени (day, week, two-weeks, month).
 * @returns {Array} Массив данных для гистограммы.
 */
export function calculateHistogramData(
  tasks,
  timeframeFrom,
  timeframeTo,
  columns,
  selectedColumns,
  resolution
) {
  const histogramData = {};

  // Рассчитать лидтайм для каждой задачи
  Object.entries(tasks).forEach(([taskKey, taskDetails]) => {
    const selectedColumnIndices = selectedColumns.map((columnName) =>
      getColumnIndexByName(columns, columnName, taskDetails)
    );

    const leadTime = selectedColumnIndices.reduce((total, columnIndex) => {
      const duration = taskDetails.durations[columnIndex] || 0;
      return total + convertTimeToResolution(duration, resolution);
    }, 0);

    const roundedLeadTime = Math.round(leadTime);
    if (!histogramData[roundedLeadTime]) {
      histogramData[roundedLeadTime] = { count: 0, tasks: [] };
    }
    histogramData[roundedLeadTime].count += 1;
    histogramData[roundedLeadTime].tasks.push(taskKey);
  });

  // Преобразование в массив
  return Object.entries(histogramData).map(([leadTime, data]) => ({
    leadTime: Number(leadTime),
    count: data.count,
    tasks: data.tasks,
  }));
}

/**
 * Фильтрует задачу по временному интервалу, выбранным колонкам и наличию длительности в этих колонках.
 *
 * Эта функция проверяет, попадает ли задача в указанный временной интервал
 * и имеет ли она длительность нахождения в одной из выбранных колонок больше нуля.
 *
 * @param {Object} task - Объект задачи, содержащий информацию о времени начала в различных колонках и длительности.
 * @param {Array} columns - Массив объектов колонок.
 * @param {Array} selectedColumns - Массив имен выбранных колонок.
 * @param {string} timeframeFrom - Начальная дата временного интервала в формате YYYY-MM-DD.
 * @param {string} timeframeTo - Конечная дата временного интервала в формате YYYY-MM-DD.
 *
 * @returns {boolean} Возвращает true, если задача попадает в выбранные колонки, временной интервал
 *                     и имеет длительность в колонке больше нуля, иначе возвращает false.
 */
export function filterTaskByTimeAndColumns(
  task,
  columns,
  selectedColumns,
  timeframeFrom,
  timeframeTo
) {
  return selectedColumns.some((columnName) => {
    console.log('filterTaskByTimeAndColumns columnName', columnName);
    const columnIndex = getColumnIndexByName(columns, columnName);
    const endTimes = task.ends[columnIndex] || [];

    return endTimes.some((endTime) => {
      const date = new Date(parseInt(endTime, 10)).toISOString().split('T')[0];
      return date >= timeframeFrom && date <= timeframeTo;
    });
  });
}

export function filterTaskByTime(task, columns, timeframeFrom, timeframeTo) {
  const lastColumnIndex = columns.length - 1; // Индекс последней колонки

  // Проверяем, ограничивается ли активность задачи только первой колонкой
  // let isOnlyInFirstColumn = true;
  // for (let i = 1; i < columns.length; i++) {
  //   if (task.starts[i] && task.starts[i].length > 0) {
  //     isOnlyInFirstColumn = false;
  //     break;
  //   }
  // }

  return columns.slice(0, lastColumnIndex).some((column, columnIndex) => {
    //   if (columnIndex === 0 && isOnlyInFirstColumn) {
    //     return false; // Игнорируем задачи, которые только в первой колонке
    //   }

    const endTimes = task.ends[columnIndex] || [];
    const startTimes = task.starts[columnIndex] || [];

    for (let index = 0; index < startTimes.length; index++) {
      const startDate = new Date(parseInt(startTimes[index], 10)).toISOString().split('T')[0];
      const endDate = endTimes[index]
        ? new Date(parseInt(endTimes[index], 10)).toISOString().split('T')[0]
        : timeframeTo;

      if (startDate <= timeframeTo && endDate >= timeframeFrom) {
        console.log(
          `"${task.key}" in column "${column.name}" matches criteria: Start Date = ${startDate}, End Date = ${endDate}`
        );
        return true; // Задача попадает в заданный временной интервал
      }
    }

    return false;
  });
}

/**
 * Фильтрует и подготавливает задачи на основе заданных критериев.
 * Возвращает объект, где ключи - это идентификаторы задач, а значения - детали задач,
 * включая рассчитанное время выполнения (lead time) в миллисекундах.
 *
 * @param {Object} tasks - Объект задач, где ключи - идентификаторы задач.
 * @param {Array} columns - Массив колонок для фильтрации.
 * @param {Array} selectedColumns - Выбранные колонки для учета в фильтрации.
 * @param {Date} timeframeFrom - Начальная дата для фильтрации задач.
 * @param {Date} timeframeTo - Конечная дата для фильтрации задач.
 * @returns {Object} Объект с отфильтрованными задачами и их деталями.
 *
 * Пример выходных данных:
 * {
 *   task1: { / детали задачи /, leadTime: 5000 },
 *   task2: { / детали задачи /, leadTime: 7000 },
 *   ...
 * }
 */
export function prepareFilteredTasks(tasks, columns, selectedColumns, timeframeFrom, timeframeTo) {
  console.log('prepareFilteredTasks Start >>', tasks);
  return Object.entries(tasks).reduce((acc, [taskKey, taskDetails]) => {
    if (filterTaskByTime(taskDetails, columns, timeframeFrom, timeframeTo)) {
      const selectedColumnIndices = selectedColumns.map((columnName) =>
        getColumnIndexByName(columns, columnName)
      );

      const leadTime = selectedColumnIndices.reduce((total, columnIndex) => {
        const duration = taskDetails.durations[columnIndex] || 0;
        return total + duration;
      }, 0);

      acc[taskKey] = {
        ...taskDetails,
        leadTime,
      };
    }
    return acc;
  }, {});
}

/**
 * Подготавливает массив данных для гистограммы на основе отфильтрованных задач.
 * Каждый элемент массива представляет собой объект с информацией для отдельного столбца гистограммы,
 * включая время выполнения задачи (lead time), количество задач и массив идентификаторов задач.
 *
 * @param {Object} filteredTasks - Объект с отфильтрованными задачами.
 * @param {String} resolution - Разрешение времени (например, 'week', 'month').
 * @returns {Array} Массив объектов для каждого столбца гистограммы.
 *
 * Пример выходных данных:
 * [
 *   { leadTime: 5, count: 2, tasks: ['task1', 'task3'] },
 *   { leadTime: 7, count: 1, tasks: ['task2'] },
 *   ...
 * ]
 */
export function prepareHistogramArray(filteredTasks, resolution) {
  const localHistogramData = {};

  Object.entries(filteredTasks).forEach(([taskId, taskDetails]) => {
    const leadTime = convertTimeToResolution(taskDetails.leadTime, resolution);
    const roundedLeadTime = Math.round(leadTime);

    if (roundedLeadTime > 0) {
      if (!localHistogramData[roundedLeadTime]) {
        localHistogramData[roundedLeadTime] = { count: 0, tasks: [] };
      }
      localHistogramData[roundedLeadTime].count += 1;
      localHistogramData[roundedLeadTime].tasks.push(taskId); // Добавляем идентификатор задачи
    }
  });

  return Object.entries(localHistogramData).map(([leadTime, data]) => ({
    leadTime: Number(leadTime),
    count: data.count,
    tasks: data.tasks,
  }));
}

export function debugLog(...messages) {
  if (isDebug) {
    // eslint-disable-next-line no-console
    console.log(...messages);
  }
}

export function debugError(...messages) {
  if (isDebug) {
    // eslint-disable-next-line no-console
    console.error(...messages);
  }
}
