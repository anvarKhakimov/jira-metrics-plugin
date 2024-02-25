import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { blue } from '@mui/material/colors';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';
import { durationToReadableFormat, debugLog } from '../../utils/utils';
import Row from './ Row';
import Filters from '../Filters/Filters';

function sortTasks(tasks, comparator) {
  const stabilizedThis = tasks.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]); // Измените это на a[0], b[0], если ключ задачи является первым элементом массива
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function TasksTable() {
  const { settings, updateSettings } = useGlobalSettings();
  const { cfdData } = useJiraDataContext();
  const { displayedTasks, selectedColumns } = useChartDataContext();
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('leadTime');
  //const [dateFormat, setDateFormat] = useState('default');
  const tasksEntries = Object.entries(displayedTasks);
  const columnsInOrder = cfdData.columns.filter((column) => selectedColumns.includes(column.name));
  const dateFormat = settings.dateFormat || 'default';

  function handleSortRequest(property) {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }

  function descendingComparator(a, b, orderBy) {
    // Если сортируем по ключу задачи или времени выполнения
    if (orderBy === 'taskKey' || orderBy === 'leadTime') {
      if (b[1][orderBy] < a[1][orderBy]) {
        return -1;
      }
      if (b[1][orderBy] > a[1][orderBy]) {
        return 1;
      }
      return 0;
    }
    // Сортировка по имени колонки
    const columnIndexA = cfdData.columns.findIndex((col) => col.name === orderBy);
    const columnIndexB = cfdData.columns.findIndex((col) => col.name === orderBy);
    const durationA = columnIndexA !== -1 ? a[1].durations[columnIndexA] || 0 : 0;
    const durationB = columnIndexB !== -1 ? b[1].durations[columnIndexB] || 0 : 0;

    return durationA - durationB;
  }

  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }

  const sortedTasks = sortTasks(tasksEntries, getComparator(order, orderBy));

  const handleChangeDateFormat = (event) => {
    //setDateFormat(event.target.value);
    updateSettings({ dateFormat: event.target.value });
  };

  return (
    <>
      <Filters showResolution={false} />
      <br />
      <FormControl sx={{ marginX: 1, minWidth: 120 }}>
        <InputLabel id="date-format-select-label">Date Format</InputLabel>
        <Select
          labelId="date-format-select-label"
          id="date-format-select"
          value={dateFormat}
          onChange={handleChangeDateFormat}
          label="Date Format"
        >
          <MenuItem value="default">Default</MenuItem>
          <MenuItem value="hours">Hours</MenuItem>
          <MenuItem value="days">Days</MenuItem>
          <MenuItem value="weeks">Weeks</MenuItem>
          <MenuItem value="timestamp">Timestamp</MenuItem>
        </Select>
      </FormControl>
      <br />
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead sx={{ bgcolor: blue[50] }}>
            <TableRow>
              <TableCell />
              <TableCell>ID</TableCell>
              <TableCell align="right" sortDirection={orderBy === 'leadTime' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'leadTime'}
                  direction={orderBy === 'leadTime' ? order : 'asc'}
                  onClick={() => handleSortRequest('leadTime')}
                >
                  Σ Lead Time
                </TableSortLabel>
              </TableCell>
              {columnsInOrder.map((column) => (
                <TableCell
                  key={column.name}
                  align="right"
                  sortDirection={orderBy === column.name ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === column.name}
                    direction={orderBy === column.name ? order : 'asc'}
                    onClick={() => handleSortRequest(column.name)}
                  >
                    {column.name}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTasks.map(([taskKey, task], index) => (
              <Row
                key={taskKey}
                taskKey={taskKey}
                task={task}
                cfdData={cfdData}
                selectedColumns={selectedColumns}
                index={index}
                dateFormat={dateFormat}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default TasksTable;
