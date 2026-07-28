declare const require: (moduleName: 'three') => typeof import('three');

// React Three Fiber's native entry is CommonJS. Using the same runtime entry
// prevents Metro from bundling the ESM and CJS Three builds side by side.
export const THREE = require('three');
