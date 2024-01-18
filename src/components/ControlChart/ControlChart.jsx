import React, { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { durationToReadableFormat, debugLog } from "../../utils/utils";

const styles = {
  status: {
    display: "inline-block",
    width: "150px", // Задайте фиксированную ширину
    textAlign: "left",
  },
  leadTime: {
    display: "inline-block",
    textAlign: "left",
  },
  row: {
    marginBottom: "10px",
  },
};

function CustomTooltip({ active, payload, cfdData, selectedColumns }) {
  if (active && payload && payload.length) {
    const task = payload[0].payload;

    const statusDurations = cfdData.columns
      .filter((column) => selectedColumns.includes(column.name))
      .map((column) => {
        const columnIndex = cfdData.columns.findIndex(
          (col) => col.name === column.name
        );
        const columnDuration = task.durations[columnIndex] || 0;
        return {
          name: column.name,
          duration: columnDuration,
        };
      });

    return (
      <Paper style={{ padding: "10px" }}>
        <Typography variant="subtitle1">{task.taskId}</Typography>
        {statusDurations.map((status) => (
          <div style={styles.row} key={status.name}>
            <span style={styles.status}>{status.name}</span>
            <span style={styles.leadTime}>
              {durationToReadableFormat(status.duration)}
            </span>
          </div>
        ))}
        <Typography variant="body2">
          Cycle Time: {durationToReadableFormat(task.leadTime)}
        </Typography>
      </Paper>
    );
  }

  return null;
}

// Форматирование числовых значений оси X обратно в строки дат
const formatDateFromAxisValue = (value) => {
  const date = new Date(value);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Месяцы начинаются с 0
  const year = date.getFullYear().toString().slice(-2); // Получение последних двух цифр года
  return `${day}.${month}.${year}`; // Формат DD.MM.YY
};

const generateIntervalLabels = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);

  let interval;
  if (diffDays <= 30) {
    // Если разница меньше или равна 30 дням, выбираем интервал в 5 дней
    interval = { days: 2 };
    debugLog("generateIntervalLabels", "days: 2");
  } else if (diffDays <= 183) {
    interval = { days: 7 };
    debugLog("generateIntervalLabels", "days: 7");
  } else if (diffDays <= 480) {
    // Если разница меньше или равна полугоду, выбираем интервал в 1 месяц
    interval = { months: 1 };
    debugLog("generateIntervalLabels", "months: 1");
  } else {
    // Если разница больше, выбираем интервал в 3 месяца
    interval = { months: 3 };
    debugLog("generateIntervalLabels", "months: 3 ");
  }

  const labels = [];
  const current = new Date(start.getTime());
  while (current <= end) {
    labels.push(current.toISOString().split("T")[0]);

    if (interval.days) {
      current.setDate(current.getDate() + interval.days);
    } else if (interval.months) {
      current.setMonth(current.getMonth() + interval.months);
    }
  }

  return labels.map((dateStr) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}.${m}.${y}`; // Преобразование в формат DD.MM.YYYY
  });
};

function ControlChart({
  displayedTasks,
  cfdData,
  selectedColumns,
  timeframeFrom,
  timeframeTo,
}) {
  const [activeTask, setActiveTask] = useState(null);

  const transformedData = useMemo(() => {
    let earliestDate = new Date(timeframeTo).getTime();

    const filteredTasks = Object.entries(displayedTasks).map(
      ([taskId, taskData]) => {
        const relevantStarts = Object.entries(taskData.starts)
          .filter(([columnId]) =>
            selectedColumns.includes(cfdData.columns[columnId].name)
          )
          .map(([, dates]) => Math.max(...dates));

        const latestStart = Math.max(...relevantStarts);
        earliestDate = Math.min(earliestDate, latestStart);

        return {
          taskId,
          startDate: new Date(latestStart).toISOString().split("T")[0],
          startDateValue: latestStart,
          leadTime: taskData.leadTime,
          durations: taskData.durations,
        };
      }
    );

    return filteredTasks.filter((task) => task !== null);
  }, [displayedTasks, selectedColumns, cfdData.columns, timeframeTo]);

  // Генерация лейблов для оси X
  const xLabels = useMemo(() => generateIntervalLabels(timeframeFrom, timeframeTo), [timeframeFrom, timeframeTo]);

  // Преобразуем сгенерированные лейблы обратно в числовые значения для ticks
  const tickValues = xLabels.map((label) =>
    new Date(label.split(".").reverse().join("-")).getTime()
  );

  const handleScatterClick = (data) => {
    setActiveTask(data);
  };

  const handleChartClick = () => {
    
    // setActiveTask(null);
  };

  return (
    <ResponsiveContainer width="100%" height={600}>
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        onClick={handleChartClick}
      >
        <CartesianGrid horizontal vertical={false} />
        <XAxis
          type="number"
          dataKey="startDateValue"
          domain={["dataMin", "dataMax"]}
          tickFormatter={formatDateFromAxisValue}
          ticks={tickValues}
        />
        <YAxis type="number" dataKey="leadTime" />
        <Tooltip
          content={
            <CustomTooltip
              active={!!activeTask}
              payload={activeTask ? [activeTask] : []}
              cfdData={cfdData}
              selectedColumns={selectedColumns}
            />
          }
          active={!!activeTask}
        />
        <Scatter
          name="Tasks"
          data={transformedData}
          fill="#8884d8"
          onClick={handleScatterClick}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default ControlChart;
