import {get, set} from 'idb-keyval'
import {StateStorage} from "zustand/middleware";
// Custom storage object
const Storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await get(name) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  }
}


export default Storage;
