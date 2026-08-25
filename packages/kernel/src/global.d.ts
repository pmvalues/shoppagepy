// Ambient declarations for webpack-specific globals used by the kernel's
// Node.js SQLite access paths. These are provided at runtime by the bundler
// (or fall back to eval('require')) but are not present in the TypeScript scope.
declare const __non_webpack_require__: any;
