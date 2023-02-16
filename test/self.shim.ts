let selfShim: any;

try {
  // eslint-disable-next-line no-undef
  selfShim = self || {};
} catch (e) {
  selfShim = {};
}

export default selfShim;
