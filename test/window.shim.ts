// eslint-disable-next-line import/no-mutable-exports
let windowShim: any;

try {
  // eslint-disable-next-line no-undef
  windowShim = window || {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __TREZOR_CONNECT_SRC: null,
    location: {
      protocol: 'https',
    },
    addEventListener: () => false,
    setTimeout: () => false,
  };
} catch (e) {
  windowShim = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __TREZOR_CONNECT_SRC: null,
    location: {
      protocol: 'https',
    },
    addEventListener: () => false,
    setTimeout: () => false,
  };
}

export default windowShim;
