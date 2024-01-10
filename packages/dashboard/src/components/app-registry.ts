import { BeaconsApp } from './beacons-app';
import { DoorsApp } from './doors/doors-app';
import { LiftsApp } from './lifts/lifts-app';
import { MapApp } from './map-app';
import { RobotInfoApp } from './robots/robot-info-app';
import { RobotsApp } from './robots/robots-app';
import { TaskDetailsApp } from './tasks/task-details-app';
import { TaskLogsApp } from './tasks/task-logs-app';
import { TasksApp } from './tasks/tasks-app';
import { LogsApp } from './logs/logs-app';

export const AppRegistry = {
  Beacons: BeaconsApp,
  Doors: DoorsApp,
  Lifts: LiftsApp,
  Map: MapApp,
  Tasks: TasksApp,
  Logs: LogsApp,
  'Task Details': TaskDetailsApp,
  'Task Logs': TaskLogsApp,
  Robots: RobotsApp,
  'Robot Info': RobotInfoApp,
};
