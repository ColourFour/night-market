// Session credentials remain usable in this tab if the browser blocks storage.
// Touch only this app's keys; never clear storage shared with other sites/apps.
const memory=new Map();
export const session={
  getItem(key){if(memory.has(key))return memory.get(key);try{return sessionStorage.getItem(key);}catch{return null;}},
  setItem(key,value){memory.set(key,String(value));try{sessionStorage.setItem(key,String(value));}catch{}},
  removeItem(key){memory.set(key,null);try{sessionStorage.removeItem(key);}catch{}}
};
