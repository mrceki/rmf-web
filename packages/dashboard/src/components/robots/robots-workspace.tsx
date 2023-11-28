import { WorkspaceState } from '../workspace';

export const robotsWorkspace: WorkspaceState = {
  layout: [
    { i: 'robots', x: 0, y: 0, w: 7, h: 6 },
    { i: 'map', x: 8, y: 0, w: 5, h: 12 },
    { i: 'tasks', x: 0, y: 6, w: 7, h: 6 },
  ],
  windows: [
    { key: 'robots', appName: 'Robots' },
    { key: 'map', appName: 'Map' },
    { key: 'tasks', appName: 'Tasks' },
  ],
};
