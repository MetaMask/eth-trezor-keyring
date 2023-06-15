import TrezorConnect, { DEVICE, DEVICE_EVENT } from '@trezor/connect-web';

import { TrezorConnectBridge } from './trezor-connect-bridge';
import { TrezorBridge } from './trezor-bridge';
import { TREZOR_CONNECT_MANIFEST } from './trezor-keyring';

describe('TrezorConnectBridge', function () {
  let bridge: TrezorBridge;

  beforeEach(function () {
    bridge = new TrezorConnectBridge();
  });

  afterEach(function () {
    jest.resetAllMocks();
  });

  describe('init', function () {
    it('sets the event listener and calls init', async function () {
      const onSpy = jest
        .spyOn(TrezorConnect, 'on')
        .mockImplementation((_, cb) => {
          cb({
            type: DEVICE.CONNECT,
            payload: { features: { model: '1' } },
          } as any);
        });
      const initSpy = jest.spyOn(TrezorConnect, 'init');

      await bridge.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });

      expect(onSpy).toHaveBeenCalledTimes(1);
      expect(onSpy).toHaveBeenCalledWith(DEVICE_EVENT, expect.any(Function));
      expect(bridge.model).toBe('1');

      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(initSpy).toHaveBeenCalledWith({
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });
    });

    it('event handler does not set model on wrong event type', async function () {
      const onSpy = jest
        .spyOn(TrezorConnect, 'on')
        .mockImplementation((_, cb) => {
          cb({
            type: 'wrong-event-type',
          } as any);
        });

      await bridge.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });

      expect(onSpy).toHaveBeenCalledTimes(1);
      expect(onSpy).toHaveBeenCalledWith(DEVICE_EVENT, expect.any(Function));
      expect(bridge.model).toBeUndefined();
    });

    it('event handler does not set model if features object is missing', async function () {
      const onSpy = jest
        .spyOn(TrezorConnect, 'on')
        .mockImplementation((_, cb) => {
          cb({
            type: DEVICE.CONNECT,
            payload: {},
          } as any);
        });

      await bridge.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });

      expect(onSpy).toHaveBeenCalledTimes(1);
      expect(onSpy).toHaveBeenCalledWith(DEVICE_EVENT, expect.any(Function));
      expect(bridge.model).toBeUndefined();
    });

    it('does not call init again if already initialised', async function () {
      const initSpy = jest.spyOn(TrezorConnect, 'init');

      await bridge.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });

      await bridge.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });

      expect(initSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose', function () {
    it('calls dispose', async function () {
      const disposeSpy = jest.spyOn(TrezorConnect, 'dispose');

      await bridge.dispose();

      expect(disposeSpy).toHaveBeenCalledTimes(1);
      expect(disposeSpy).toHaveBeenCalledWith();
    });
  });

  describe('getPublicKey', function () {
    it('calls getPublicKey', async function () {
      const getPublicKeySpy = jest.spyOn(TrezorConnect, 'getPublicKey');

      const params = {
        path: `m/44'/60'/0'/0`,
        coin: 'ETH',
      };
      await bridge.getPublicKey(params);

      expect(getPublicKeySpy).toHaveBeenCalledTimes(1);
      expect(getPublicKeySpy).toHaveBeenCalledWith(params);
    });
  });

  describe('ethereumSignTransaction', function () {
    it('calls ethereumSignTransaction', async function () {
      const ethereumSignTransactionSpy = jest.spyOn(
        TrezorConnect,
        'ethereumSignTransaction',
      );

      const params = {
        path: `m/44'/60'/0'/0`,
        transaction: {
          chainId: 1,
          to: '0x0',
          value: '0',
          gasLimit: '0',
          nonce: '0',
          maxFeePerGas: '0',
          maxPriorityFeePerGas: '0',
        },
      };
      await bridge.ethereumSignTransaction(params);

      expect(ethereumSignTransactionSpy).toHaveBeenCalledTimes(1);
      expect(ethereumSignTransactionSpy).toHaveBeenCalledWith(params);
    });
  });

  describe('ethereumSignMessage', function () {
    it('calls ethereumSignMessage', async function () {
      const ethereumSignMessageSpy = jest.spyOn(
        TrezorConnect,
        'ethereumSignMessage',
      );

      const params = {
        path: `m/44'/60'/0'/0`,
        message: '',
        hex: true,
      };
      await bridge.ethereumSignMessage(params);

      expect(ethereumSignMessageSpy).toHaveBeenCalledTimes(1);
      expect(ethereumSignMessageSpy).toHaveBeenCalledWith(params);
    });
  });

  describe('ethereumSignTypedData', function () {
    it('calls ethereumSignTypedData', async function () {
      const ethereumSignTypedDataSspy = jest.spyOn(
        TrezorConnect,
        'ethereumSignTypedData',
      );

      const params = {
        path: `m/44'/60'/0'/0`,
        data: {
          types: {
            EIP712Domain: [],
          },
          primaryType: 'EIP712Domain' as const,
          domain: {},
          message: {},
        },
        metamask_v4_compat: true,
        domain_separator_hash: '',
        message_hash: '',
      };
      await bridge.ethereumSignTypedData(params);

      expect(ethereumSignTypedDataSspy).toHaveBeenCalledTimes(1);
      expect(ethereumSignTypedDataSspy).toHaveBeenCalledWith(params);
    });
  });
});
