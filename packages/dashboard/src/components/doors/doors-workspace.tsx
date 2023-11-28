import { WorkspaceState } from '../workspace';

export const doorsWorkspace: WorkspaceState = {
  layout: [
    { i: 'doors', x: 0, y: 0, w: 7, h: 6 },
    { i: 'lifts', x: 0, y: 3.5, w: 7, h: 6 },
    { i: 'map', x: 8, y: 0, w: 5, h: 12 },
  ],
  windows: [
    { key: 'doors', appName: 'Doors' },
    { key: 'map', appName: 'Map' },
    { key: 'lifts', appName: 'Lifts' },
  ],
};
