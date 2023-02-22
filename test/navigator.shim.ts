// eslint-disable-next-line import/no-mutable-exports
let navigatorShim: any;

try {
  // eslint-disable-next-line no-undef
  navigatorShim = window || {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
  };
} catch (e) {
  navigatorShim = {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
  };
}

export default navigatorShim;
