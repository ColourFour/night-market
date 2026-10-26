if(new URLSearchParams(location.search).get('solo')==='1')await import('./frontier-solo.js?v=solo1');
else await import('./pairs.js?v=layout1');
