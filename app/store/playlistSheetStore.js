import { create } from 'zustand';

export const usePlaylistSheetStore = create((set, get) => ({
  open: null,

  setOpen: (fn) => set({ open: fn }),
  openSheet: () => {
    const openFn = get().open;
    openFn?.();
  },
}));