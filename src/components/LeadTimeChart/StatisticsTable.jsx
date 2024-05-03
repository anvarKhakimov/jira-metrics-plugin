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

function StatisticsTable({ histogramData }) {
  // Расчет среднего значения лидтайма
  const totalLeadTime = histogramData.reduce((sum, data) => sum + data.leadTime * data.count, 0);
  const totalCount = histogramData.reduce((sum, data) => sum + data.count, 0);
  const mean = totalCount ? totalLeadTime / totalCount : 0;

  // Функция для расчета процентилей
  const calculatePercentile = (percentile) => {
    const sortedLeadTimes = histogramData
      .flatMap((data) => Array(data.count).fill(data.leadTime))
      .sort((a, b) => a - b);

    const index = Math.ceil((percentile / 100) * sortedLeadTimes.length) - 1;
    return sortedLeadTimes[index] || 0;
  };

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
                Total Issues
              </TableCell>
              <TableCell align="right">{totalCount}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell component="th" scope="row">
                Average Value
              </TableCell>
              <TableCell align="right">{mean.toFixed(2)}</TableCell>
            </TableRow>
            {[50, 75, 80, 85, 90, 95, 100].map((percentile) => (
              <TableRow key={percentile}>
                <TableCell>{percentile}th Percentile</TableCell>
                <TableCell align="right">{calculatePercentile(percentile)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default StatisticsTable;
