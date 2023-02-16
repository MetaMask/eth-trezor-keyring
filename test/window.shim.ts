let windowShim: any;

try {
  // eslint-disable-next-line no-undef
  windowShim = window || {
    __TREZOR_CONNECT_SRC: null,
    location: {
      protocol: 'https',
    },
    addEventListener: () => false,
    setTimeout: () => false,
  };
} catch (e) {
  windowShim = {
    __TREZOR_CONNECT_SRC: null,
    location: {
      protocol: 'https',
    },
    addEventListener: () => false,
    setTimeout: () => false,
  };
}

export default windowShim;
