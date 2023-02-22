// eslint-disable-next-line import/no-mutable-exports
let selfShim: any;

try {
  selfShim = self || {};
} catch (e) {
  selfShim = {};
}

export default selfShim;
