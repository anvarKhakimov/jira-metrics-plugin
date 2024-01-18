import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import Tooltip from '@mui/material/Tooltip';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import useJiraData from '../../contexts/JiraDataContext';
import { durationToReadableFormat, debugLog } from '../../utils/utils';

function TaskTimeline({ task, columnNames }) {
  // Создаем отображение названий колонок в их индексы
  const columnIndexMapping = columnNames.reduce((acc, { name }, index) => {
    acc[index] = name;
    return acc;
  }, {});

  // Собираем все события начала и окончания в один массив и сортируем по времени
  const timelineEvents = [];
  Object.entries(task.starts).forEach(([columnIndex, startTimes]) => {
    const columnName = columnIndexMapping[columnIndex];
    startTimes.forEach((startTime) => {
      timelineEvents.push({
        time: startTime,
        type: 'start',
        columnName,
        columnIndex,
      });
    });
  });
  Object.entries(task.ends).forEach(([columnIndex, endTimes]) => {
    const columnName = columnIndexMapping[columnIndex];
    endTimes.forEach((endTime) => {
      timelineEvents.push({
        time: endTime,
        type: 'end',
        columnName,
        columnIndex,
      });
    });
  });
  timelineEvents.sort((a, b) => a.time - b.time);

  // Генерируем timelineData, учитывая хронологию событий
  const timelineData = [];
  const activeSegments = {};
  timelineEvents.forEach((event) => {
    if (event.type === 'start') {
      activeSegments[event.columnName] = event.time;
    } else if (event.type === 'end' && activeSegments[event.columnName]) {
      const duration = event.time - activeSegments[event.columnName];
      if (duration > 0) {
        timelineData.push({
          duration,
          color: `color${event.columnIndex}`,
          name: event.columnName,
        });
      }
      delete activeSegments[event.columnName];
    }
  });

  // Сумма продолжительностей всех сегментов для расчета доли каждого сегмента
  const totalDuration = timelineData.reduce(
    (total, { duration }) => total + duration,
    0
  );

  const positionRef = React.useRef({
    x: 0,
    y: 0,
  });
  const popperRef = React.useRef(null);
  const areaRef = React.useRef(null);

  const handleMouseMove = (event) => {
    positionRef.current = { x: event.clientX, y: event.clientY };

    if (popperRef.current != null) {
      popperRef.current.update();
    }
  };

  return (
    <div className="timeline-container">
      <div className="timeline">
        {timelineData.map((data) => (
          <Tooltip
            key={data.name}
            title={
              <>
                <div>{data.name}</div>
                <div>{durationToReadableFormat(data.duration)}</div>
              </>
            }
            placement="top"
            arrow
            PopperProps={{
              popperRef,
              anchorEl: {
                getBoundingClientRect: () =>
                  new DOMRect(
                    positionRef.current.x,
                    areaRef.current.getBoundingClientRect().y,
                    0,
                    0
                  ),
              },
            }}
          >
            <div
              ref={areaRef}
              key={data.name}
              className={`timeline-segment ${data.color}`}
              style={{
                flexGrow: totalDuration ? data.duration / totalDuration : 0,
                backgroundColor: data.color,
                minWidth: '2px',
                position: 'relative',
              }}
              onMouseMove={handleMouseMove}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function Row({ taskKey, task, cfdData, selectedColumns, index }) {
  const { jiraBaseUrl } = useJiraData();
  const [open, setOpen] = useState(false);
  const rowColor = index % 2 === 0 ? '#fafafa' : '#ffffff';
  const jiraDomain = new URL(jiraBaseUrl).origin;

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, bgcolor: rowColor }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <a
            href={`${jiraDomain}/browse/${taskKey}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {taskKey}
          </a>
        </TableCell>
        <TableCell align="right">
          {durationToReadableFormat(task.leadTime)}
        </TableCell>
        {cfdData.columns.map((column) => {
          if (selectedColumns.includes(column.name)) {
            const columnIndex = cfdData.columns.findIndex(
              (col) => col.name === column.name
            );
            // Используем имя колонки для получения продолжительности из task.durations
            const columnDuration = task.durations[columnIndex] || 0;

            return (
              <TableCell key={column.name} align="right">
                {columnDuration
                  ? durationToReadableFormat(columnDuration)
                  : '0'}
              </TableCell>
            );
          }
          return null; // Возвращаем null для колонок, которые не выбраны
        })}
      </TableRow>
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={6 + selectedColumns.length}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Timeline
              </Typography>
              <TaskTimeline
                task={task}
                columnNames={cfdData.columns}            
              />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function TasksTable({ displayedTasks, cfdData, selectedColumns }) {
  debugLog('Tasks Table');
  const tasksEntries = Object.entries(displayedTasks);
  const columnsInOrder = cfdData.columns.filter((column) =>
    selectedColumns.includes(column.name)
  );

  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead sx={{ bgcolor: blue[50] }}>
          <TableRow>
            <TableCell />
            <TableCell>ID</TableCell>
            <TableCell align="right">Σ Lead Time</TableCell>
            {columnsInOrder.map((column) => (
              <TableCell key={column.name} align="right">
                {column.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {tasksEntries.map(([taskKey, task], index) => (
            <Row
              key={taskKey}
              taskKey={taskKey}
              task={task}
              cfdData={cfdData}
              selectedColumns={selectedColumns}
              index={index}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TasksTable;
