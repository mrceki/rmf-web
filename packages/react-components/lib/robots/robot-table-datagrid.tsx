import {
  DataGrid,
  GridColDef,
  GridEventListener,
  GridValueGetterParams,
  MuiEvent,
  GridRowParams,
  GridCellParams,
} from '@mui/x-data-grid';
import { Box, SxProps, Typography, useTheme } from '@mui/material';
import * as React from 'react';
import { Status2 } from 'api-client';
import { RobotTableData } from './robot-table';
import { robotStatusToUpperCase } from './utils';
import { useTranslation } from 'react-i18next';

export interface RobotDataGridTableProps {
  onRobotClick?(ev: MuiEvent<React.MouseEvent<HTMLElement>>, robotName: RobotTableData): void;
  robots: RobotTableData[];
}

export function RobotDataGridTable({ onRobotClick, robots }: RobotDataGridTableProps): JSX.Element {
  const handleEvent: GridEventListener<'rowClick'> = (
    params: GridRowParams,
    event: MuiEvent<React.MouseEvent<HTMLElement>>,
  ) => {
    if (onRobotClick) {
      onRobotClick(event, params.row);
    }
  };

  const Status = (params: GridCellParams): React.ReactNode => {
    const theme = useTheme();
    const statusLabelStyle: SxProps = (() => {
      const error = {
        color: theme.palette.error.main,
      };
      const charging = {
        color: theme.palette.info.main,
      };
      const working = {
        color: theme.palette.success.main,
      };
      const defaultColor = {
        color: theme.palette.warning.main,
      };

      const statusUpperCase = params.row.status.toUpperCase();

      switch (statusUpperCase) {
        case 'ERROR':
          return error;
        case 'CHARGING':
          return charging;
        case 'WORKING':
          return working;
        default:
          return defaultColor;
      }
    })();

    const translatedStatus = t(`RobotStatus.${params.row.status}`);
    return (
      <Box component="div" sx={statusLabelStyle}>
        <Typography
          data-testid="status"
          component="p"
          sx={{
            fontWeight: 'bold',
            fontSize: 14,
          }}
        >
          {translatedStatus}
        </Typography>
      </Box>
    );
  };
  const { t } = useTranslation();
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: t('name'),
      width: 150,
      editable: false,
      valueGetter: (params: GridValueGetterParams) => params.row.name,
      flex: 1,
      filterable: true,
    },
    {
      field: 'fleet',
      headerName: t('fleet'),
      width: 90,
      valueGetter: (params: GridValueGetterParams) => params.row.fleet,
      flex: 1,
      filterable: true,
    },
    {
      field: 'estFinishTime',
      headerName: t('estFinishTime'),
      width: 150,
      editable: false,
      valueGetter: (params: GridValueGetterParams) =>
        params.row.estFinishTime ? new Date(params.row.estFinishTime).toLocaleString() : '-',
      flex: 1,
      filterable: true,
    },
    {
      field: 'level',
      headerName: t('level'),
      width: 150,
      editable: false,
      valueGetter: (params: GridValueGetterParams) => params.row.level,
      flex: 1,
      filterable: true,
    },
    {
      field: 'battery',
      headerName: t('battery'),
      width: 150,
      editable: false,
      valueGetter: (params: GridValueGetterParams) => `${params.row.battery * 100}%`,
      flex: 1,
      filterable: true,
    },
    {
      field: 'lastUpdateTime',
      headerName: t('lastUpdated'),
      width: 150,
      editable: false,
      valueGetter: (params: GridValueGetterParams) =>
        params.row.lastUpdateTime ? new Date(params.row.lastUpdateTime).toLocaleString() : '-',
      flex: 1,
      filterable: true,
    },
    {
      field: 'status',
      headerName: t('status'),
      editable: false,
      flex: 1,
      renderCell: Status,
      filterable: true,
    },
  ];

  return (
    <DataGrid
      autoHeight={true}
      getRowId={(r) => r.name}
      rows={robots}
      pageSize={5}
      rowHeight={38}
      columns={columns}
      rowsPerPageOptions={[5]}
      onRowClick={handleEvent}
      initialState={{
        sorting: {
          sortModel: [{ field: 'name', sort: 'asc' }],
        },
      }}
    />
  );
}
