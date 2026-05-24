import { createLocalStore } from './localStore.js';

const store = createLocalStore('klask-4-state.json', 'Klask-4 state');

export const readState = store.readState;
export const writeState = store.writeState;
