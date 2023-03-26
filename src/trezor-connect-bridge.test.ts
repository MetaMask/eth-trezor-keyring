import * as sinon from 'sinon';
import chai from 'chai';

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
    sinon.restore();
  });

  describe('init', function () {
    it('sets the event listener and calls init', async function () {
      const onStub = sinon.stub(TrezorConnect, 'on');
      const initStub = sinon.stub(TrezorConnect, 'init');

      await bridge.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });

      sinon.assert.calledOnce(onStub);
      sinon.assert.calledWithExactly(
        onStub,
        DEVICE_EVENT as any,
        sinon.match.func,
      );

      sinon.assert.calledOnce(initStub);
      sinon.assert.calledWithExactly(initStub, {
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });
    });

    it('is executed once', async function () {
      const initStub = sinon.stub(TrezorConnect, 'init');

      chai.expect((bridge as any).trezorConnectInitiated).to.equal(false);

      await bridge.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });

      chai.expect((bridge as any).trezorConnectInitiated).to.equal(true);

      // try to re-initialize
      await bridge.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });

      // underlying init should only be called once
      sinon.assert.calledOnce(initStub);
    });
  });

  describe('dispose', function () {
    it('calls dispose', async function () {
      const disposeStub = sinon.stub(TrezorConnect, 'dispose');

      await bridge.dispose();

      sinon.assert.calledOnce(disposeStub);
      sinon.assert.calledWithExactly(disposeStub);
    });
  });

  describe('getPublicKey', function () {
    it('calls getPublicKey', async function () {
      const getPublicKeyStub = sinon.stub(TrezorConnect, 'getPublicKey');

      const params = {
        path: `m/44'/60'/0'/0`,
        coin: 'ETH',
      } as any;
      await bridge.getPublicKey(params);

      sinon.assert.calledOnce(getPublicKeyStub);
      sinon.assert.calledWithExactly(getPublicKeyStub, params);
    });
  });

  describe('ethereumSignTransaction', function () {
    it('calls ethereumSignTransaction', async function () {
      const ethereumSignTransactionStub = sinon.stub(
        TrezorConnect,
        'ethereumSignTransaction',
      );

      const params: any = {
        path: `m/44'/60'/0'/0`,
        transaction: {
          chainId: 1,
          to: '0x0',
        },
      };
      await bridge.ethereumSignTransaction(params);

      sinon.assert.calledOnce(ethereumSignTransactionStub);
      sinon.assert.calledWithExactly(ethereumSignTransactionStub, params);
    });
  });

  describe('ethereumSignMessage', function () {
    it('calls ethereumSignMessage', async function () {
      const ethereumSignMessageStub = sinon.stub(
        TrezorConnect,
        'ethereumSignMessage',
      );

      const params = {
        path: `m/44'/60'/0'/0`,
        message: '',
        hex: true,
      };
      await bridge.ethereumSignMessage(params);

      sinon.assert.calledOnce(ethereumSignMessageStub);
      sinon.assert.calledWithExactly(ethereumSignMessageStub, params);
    });
  });

  describe('ethereumSignTypedData', function () {
    it('calls ethereumSignTypedData', async function () {
      const ethereumSignTypedDataStub = sinon.stub(
        TrezorConnect,
        'ethereumSignTypedData',
      );

      const params = {
        path: `m/44'/60'/0'/0`,
        data: {},
        metamask_v4_compat: true,
        domain_separator_hash: '',
        message_hash: '',
      } as any;
      await bridge.ethereumSignTypedData(params);

      sinon.assert.calledOnce(ethereumSignTypedDataStub);
      sinon.assert.calledWithExactly(ethereumSignTypedDataStub, params);
    });
  });
});
