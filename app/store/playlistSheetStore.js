import { create } from 'zustand';

export const usePlaylistSheetStore = create((set, get) => ({
  open: null,

  setOpen: (fn) => set({ open: fn }),
  openSheet: () => {
    console.log("OPEN TRIGGERED");
    const openFn = get().open;
    console.log("FUNCTION:", openFn);
    openFn?.();
  },
}));