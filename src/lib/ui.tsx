import { createContext, useContext } from 'react';

export interface UI {
  /** Move a task into This Week, opening the swap sheet if the week is full. Returns true if it was placed now. */
  placeThisWeek: (taskId: string) => boolean;
  openMove: (taskId: string) => void;
  openAdd: () => void;
  openSettings: () => void;
  startReview: () => void;
  openGuide: () => void;
  goTo: (tab: Tab) => void;
}
export type Tab = 'week' | 'inbox' | 'buckets';

export const UICtx = createContext<UI | null>(null);
export function useUI() {
  const c = useContext(UICtx);
  if (!c) throw new Error('useUI outside provider');
  return c;
}
