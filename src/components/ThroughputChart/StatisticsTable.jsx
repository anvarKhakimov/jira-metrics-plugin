import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';

function StatisticsTable({ throughputData }) {
  // Расчет общей пропускной способности (Total Throughput)
  const totalThroughput = throughputData.reduce((sum, data) => sum + data.count, 0);

  // Расчет средней пропускной способности (Average Throughput)
  const averageThroughput = totalThroughput / throughputData.length;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
      <TableContainer component={Paper} sx={{ maxWidth: 400 }}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Statistic</TableCell>
              <TableCell align="right">Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell component="th" scope="row">
                Total Throughput
              </TableCell>
              <TableCell align="right">{totalThroughput}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Average Throughput
              </TableCell>
              <TableCell align="right">{averageThroughput.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default StatisticsTable;
