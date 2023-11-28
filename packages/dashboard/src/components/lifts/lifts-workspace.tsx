import { WorkspaceState } from '../workspace';

export const liftsWorkspace: WorkspaceState = {
  layout: [
    { i: 'lifts', x: 0, y: 0, w: 7, h: 12 },
    { i: 'map', x: 8, y: 0, w: 5, h: 12 },
  ],
  windows: [
    { key: 'lifts', appName: 'Lifts' },
    { key: 'map', appName: 'Map' },
  ],
};
