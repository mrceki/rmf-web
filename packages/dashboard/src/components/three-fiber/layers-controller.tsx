import { ChangeEvent } from 'react';
import { Level } from 'api-client';
import { AppEvents } from '../app-events';
import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  TextField,
  useTheme,
  Theme,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { RobotData } from 'react-components';
import { makeStyles, createStyles } from '@mui/styles';
import { useMediaQuery } from 'react-responsive';
import { useTranslation } from 'react-i18next';
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    inspectText: {
      color: '#ffffff',
      fontSize: '10px',
    },
  }),
);

interface LayersControllerProps {
  disabledLayers: Record<string, boolean>;
  onChange: (event: ChangeEvent<HTMLInputElement>, value: string) => void;
  levels: Level[];
  robots: RobotData[];
  robotLocations: Record<string, number[]>;
  currentLevel: Level;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleDefaultView: () => void;
}

export const LayersController = ({
  disabledLayers,
  onChange,
  levels,
  robots,
  robotLocations,
  currentLevel,
  handleZoomIn,
  handleZoomOut,
  handleDefaultView,
}: LayersControllerProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const classes = useStyles();
  const isTablet = useMediaQuery({ query: '(max-width: 1224px) and (min-height: 500px)' });
  const robotValue = robots.length === 1 ? robots[0].name : 'Click to see';
  const theme = useTheme();
  const { t } = useTranslation();
  const handleRobotClick = () => {
    const RobotLocations = Object.values(robotLocations);
    const mapCoordsLocation: [number, number] = [RobotLocations[0][0], RobotLocations[0][1]];
    const newCenter: L.LatLngTuple = [mapCoordsLocation[0], mapCoordsLocation[1]];
    AppEvents.mapCenter.next(newCenter);
    AppEvents.zoom.next(50);
  };

  return (
    <Box
      component="div"
      sx={{
        position: 'absolute',
        top: '60px',
        left: '4px',
        width: 'auto',
        height: 'auto',
        zIndex: '1',
      }}
    >
      <FormControl>
        <TextField
          select
          id="robot-select"
          label={t('robots')}
          variant="outlined"
          fullWidth
          margin="normal"
          value={robotValue}
          size="small"
          sx={{ width: '150px' }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e, e.target.value as string)}
        >
          {robots.map((robot, i) => (
            <MenuItem key={i} value={robots[i].name} onClick={() => handleRobotClick()}>
              {robots[i].name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          id="level-select"
          label={t('levels')}
          variant="outlined"
          fullWidth
          margin="normal"
          value={currentLevel.name}
          size="small"
          sx={{ width: '80px' }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e, e.target.value as string)}
        >
          {levels.map((level, i) => (
            <MenuItem key={i} value={level.name}>
              {level.name}
            </MenuItem>
          ))}
        </TextField>
      </FormControl>
      <div>
        <IconButton size="small" onClick={handleZoomIn} data-testid="zoom-in">
          <ZoomInIcon fontSize="large" />
        </IconButton>

        <IconButton size="small" onClick={handleZoomOut} data-testid="zoom-out">
          <ZoomOutIcon fontSize="large" />
        </IconButton>
      </div>
      <div>
        <Button
          sx={{
            width: isTablet ? '80px' : '100px',
            borderRadius: '20px',
            backgroundColor: theme.palette.mode === 'dark' ? '#739BD0' : '#CE172D',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#739BD0' : '#CE172D',
            },
          }}
          size="small"
          onClick={handleDefaultView}
          data-testid="default-view"
        >
          <span className={classes.inspectText}>{t('resetZoom')}</span>
        </Button>
      </div>
      <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <IconButton size="small" data-testid="layers">
          <LayersIcon fontSize="large" />
        </IconButton>
        {isHovered && (
          <div>
            {Object.keys(disabledLayers).map((layerName) => (
              <FormGroup key={layerName}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={!disabledLayers[layerName]}
                      onChange={() => {
                        const updatedLayers = { ...disabledLayers };
                        updatedLayers[layerName] = !updatedLayers[layerName];
                        AppEvents.disabledLayers.next(updatedLayers);
                      }}
                    />
                  }
                  label={layerName}
                />
              </FormGroup>
            ))}
          </div>
        )}
      </div>
    </Box>
  );
};
