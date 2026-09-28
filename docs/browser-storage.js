// Session credentials remain usable in this tab if the browser blocks storage.
// Touch only this app's keys; never clear storage shared with other sites/apps.
const memory=new Map();
export const session={
  getItem(key){if(memory.has(key))return memory.get(key);try{return sessionStorage.getItem(key);}catch{return null;}},
  setItem(key,value){memory.set(key,String(value));try{sessionStorage.setItem(key,String(value));}catch{}},
  removeItem(key){memory.set(key,null);try{sessionStorage.removeItem(key);}catch{}}
};

// Student seats survive closing/reopening the browser; blocked storage falls back to this tab.
const deviceMemory=new Map();
export const device={
 getItem(key){if(deviceMemory.has(key))return deviceMemory.get(key);try{return localStorage.getItem(key);}catch{return null;}},
 setItem(key,value){deviceMemory.set(key,String(value));try{localStorage.setItem(key,String(value));}catch{}},
 removeItem(key){deviceMemory.set(key,null);try{localStorage.removeItem(key);}catch{}}
};
