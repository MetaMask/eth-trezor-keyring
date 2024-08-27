import * as sinon from 'sinon';
import EthereumTx from 'ethereumjs-tx';
import HDKey from 'hdkey';
import {
  TypedTransaction,
  TransactionFactory,
  FeeMarketEIP1559Transaction,
} from '@ethereumjs/tx';
import { Common, Chain, Hardfork } from '@ethereumjs/common';

import { Address } from '@ethereumjs/util';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';
import { TrezorKeyring, TREZOR_CONNECT_MANIFEST } from './trezor-keyring';
import { TrezorBridge } from './trezor-bridge';

const fakeAccounts = [
  '0xF30952A1c534CDE7bC471380065726fa8686dfB3',
  '0x44fe3Cf56CaF651C4bD34Ae6dbcffa34e9e3b84B',
  '0x8Ee3374Fa705C1F939715871faf91d4348D5b906',
  '0xEF69e24dE9CdEe93C4736FE29791E45d5D4CFd6A',
  '0xC668a5116A045e9162902795021907Cb15aa2620',
  '0xbF519F7a6D8E72266825D770C60dbac55a3baeb9',
  '0x0258632Fe2F91011e06375eB0E6f8673C0463204',
  '0x4fC1700C0C61980aef0Fb9bDBA67D8a25B5d4335',
  '0xeEC5D417152aE295c047FB0B0eBd7c7090dDedEb',
  '0xd3f978B9eEEdB68A38CF252B3779afbeb3623fDf',
  '0xd819fE2beD53f44825F66873a159B687736d3092',
  '0xE761dA62f053ad9eE221d325657535991Ab659bD',
  '0xd4F1686961642340a80334b5171d85Bbd390c691',
  '0x6772C4B1E841b295960Bb4662dceD9bb71726357',
  '0x41bEAD6585eCA6c79B553Ca136f0DFA78A006899',
] as const;

const fakeXPubKey =
  'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsApME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt';
const fakeHdKey = HDKey.fromExtendedKey(fakeXPubKey);
const fakeTx = new EthereumTx({
  nonce: '0x00',
  gasPrice: '0x09184e72a000',
  gasLimit: '0x2710',
  to: '0x0000000000000000000000000000000000000000',
  value: '0x00',
  data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
  // EIP 155 chainId - mainnet: 1, ropsten: 3
  chainId: 1,
});

const common = new Common({ chain: 'mainnet' });
const commonEIP1559 = new Common({
  chain: Chain.Mainnet,
  hardfork: Hardfork.London,
});
const newFakeTx = TransactionFactory.fromTxData(
  {
    nonce: '0x00',
    gasPrice: '0x09184e72a000',
    gasLimit: '0x2710',
    to: '0x0000000000000000000000000000000000000000',
    value: '0x00',
    data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
  },
  { common, freeze: false },
);

const contractDeploymentFakeTx = TransactionFactory.fromTxData(
  {
    nonce: '0x00',
    gasPrice: '0x09184e72a000',
    gasLimit: '0x2710',
    value: '0x00',
    data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
  },
  { common, freeze: false },
);

const fakeTypeTwoTx = FeeMarketEIP1559Transaction.fromTxData(
  {
    nonce: '0x00',
    maxFeePerGas: '0x19184e72a000',
    maxPriorityFeePerGas: '0x09184e72a000',
    gasLimit: '0x2710',
    to: '0x0000000000000000000000000000000000000000',
    value: '0x00',
    data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
    type: 2,
    v: '0x01',
  },
  { common: commonEIP1559, freeze: false },
);

describe('TrezorKeyring', function () {
  let keyring: TrezorKeyring;
  let bridge: TrezorBridge;

  beforeEach(async function () {
    bridge = {} as TrezorBridge;
    keyring = new TrezorKeyring({ bridge });
    keyring.hdk = fakeHdKey;
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('Keyring.type', function () {
    it('is a class property that returns the type string.', function () {
      const { type } = TrezorKeyring;
      expect(typeof type).toBe('string');
    });

    it('returns the correct value', function () {
      const { type } = keyring;
      const correct = TrezorKeyring.type;
      expect(type).toBe(correct);
    });
  });

  describe('constructor', function () {
    it('constructs', async function () {
      const keyringInstance = new TrezorKeyring({ bridge });
      expect(typeof keyringInstance).toBe('object');
      const accounts = await keyringInstance.getAccounts();
      expect(Array.isArray(accounts)).toBe(true);
    });

    it('throws if a bridge is not provided', async function () {
      expect(
        () =>
          new TrezorKeyring({
            bridge: undefined as unknown as TrezorBridge,
          }),
      ).toThrow('Bridge is a required dependency for the keyring');
    });
  });

  describe('init', function () {
    it('initialises the bridge', async function () {
      const initStub = sinon.stub().resolves();
      bridge.init = initStub;

      await keyring.init();

      expect(initStub.calledOnce).toBe(true);
      sinon.assert.calledWithExactly(initStub, {
        manifest: TREZOR_CONNECT_MANIFEST,
        lazyLoad: true,
      });
    });
  });

  describe('destroy', function () {
    it('calls dispose on bridge', async function () {
      const disposeStub = sinon.stub().resolves();
      bridge.dispose = disposeStub;

      await keyring.destroy();

      expect(disposeStub.calledOnce).toBe(true);
      sinon.assert.calledWithExactly(disposeStub);
    });
  });

  describe('serialize', function () {
    it('serializes an instance', async function () {
      const output = await keyring.serialize();
      expect(output.page).toBe(0);
      expect(output.hdPath).toBe(`m/44'/60'/0'/0`);
      expect(Array.isArray(output.accounts)).toBe(true);
      expect(output.accounts).toHaveLength(0);
    });
  });

  describe('deserialize', function () {
    it('serializes what it deserializes', async function () {
      const someHdPath = `m/44'/60'/0'/1`;
      await keyring.deserialize({
        page: 10,
        hdPath: someHdPath,
        accounts: [],
      });
      const serialized = await keyring.serialize();
      expect(serialized.accounts).toHaveLength(0);
      expect(serialized.page).toBe(10);
      expect(serialized.hdPath).toBe(someHdPath);
    });
  });

  describe('isUnlocked', function () {
    it('should return true if we have a public key', function () {
      expect(keyring.isUnlocked()).toBe(true);
    });
  });

  describe('unlock', function () {
    it('should resolve if we have a public key', async function () {
      expect(async () => {
        await keyring.unlock();
      }).not.toThrow();
    });

    it('should call TrezorConnect.getPublicKey if we dont have a public key', async function () {
      const getPublicKeyStub = sinon.stub().resolves();
      bridge.getPublicKey = getPublicKeyStub;

      keyring.hdk = new HDKey();
      try {
        await keyring.unlock();
      } catch (e) {
        // Since we only care about ensuring our function gets called,
        // we want to ignore warnings due to stub data
      }

      expect(getPublicKeyStub.calledOnce).toBe(true);
      sinon.assert.calledWithExactly(getPublicKeyStub, {
        path: `m/44'/60'/0'/0`,
        coin: 'ETH',
      });
    });
  });

  describe('setAccountToUnlock', function () {
    it('should set unlockedAccount', function () {
      keyring.setAccountToUnlock(3);
      expect(keyring.unlockedAccount).toBe(3);
    });
  });

  describe('addAccounts', function () {
    describe('with no arguments', function () {
      it('returns a single account', async function () {
        keyring.setAccountToUnlock(0);
        const accounts = await keyring.addAccounts();
        expect(accounts).toHaveLength(1);
      });

      it('returns the custom accounts desired', async function () {
        keyring.setAccountToUnlock(0);
        await keyring.addAccounts();
        keyring.setAccountToUnlock(2);
        const accounts = await keyring.addAccounts();
        expect(accounts[0]).toBe(fakeAccounts[0]);
        expect(accounts[1]).toBe(fakeAccounts[2]);
      });
    });

    describe('with a numeric argument', function () {
      it('returns that number of accounts', async function () {
        keyring.setAccountToUnlock(0);
        const accounts = await keyring.addAccounts(5);
        expect(accounts).toHaveLength(5);
      });

      it('returns the expected accounts', async function () {
        keyring.setAccountToUnlock(0);
        const accounts = await keyring.addAccounts(3);
        expect(accounts[0]).toBe(fakeAccounts[0]);
        expect(accounts[1]).toBe(fakeAccounts[1]);
        expect(accounts[2]).toBe(fakeAccounts[2]);
      });
    });
  });

  describe('removeAccount', function () {
    describe('if the account exists', function () {
      it('should remove that account', async function () {
        keyring.setAccountToUnlock(0);
        const accounts = await keyring.addAccounts();
        expect(accounts).toHaveLength(1);
        keyring.removeAccount(fakeAccounts[0]);
        const accountsAfterRemoval = await keyring.getAccounts();
        expect(accountsAfterRemoval).toHaveLength(0);
      });

      it('should remove only the account requested', async function () {
        keyring.setAccountToUnlock(0);
        await keyring.addAccounts();
        keyring.setAccountToUnlock(1);
        await keyring.addAccounts();

        let accounts = await keyring.getAccounts();
        expect(accounts).toHaveLength(2);

        keyring.removeAccount(fakeAccounts[0]);
        accounts = await keyring.getAccounts();

        expect(accounts).toHaveLength(1);
        expect(accounts[0]).toBe(fakeAccounts[1]);
      });
    });

    describe('if the account does not exist', function () {
      it('should throw an error', function () {
        const unexistingAccount = '0x0000000000000000000000000000000000000000';
        expect(() => {
          keyring.removeAccount(unexistingAccount);
        }).toThrow(`Address ${unexistingAccount} not found in this keyring`);
      });
    });
  });

  describe('getFirstPage', function () {
    it('should set the currentPage to 1', async function () {
      await keyring.getFirstPage();
      expect(keyring.page).toBe(1);
    });

    it('should return the list of accounts for current page', async function () {
      const accounts = await keyring.getFirstPage();

      expect(accounts).toHaveLength(keyring.perPage);
      expect(accounts[0]?.address).toBe(fakeAccounts[0]);
      expect(accounts[1]?.address).toBe(fakeAccounts[1]);
      expect(accounts[2]?.address).toBe(fakeAccounts[2]);
      expect(accounts[3]?.address).toBe(fakeAccounts[3]);
      expect(accounts[4]?.address).toBe(fakeAccounts[4]);
    });
  });

  describe('getNextPage', function () {
    it('should return the list of accounts for current page', async function () {
      const accounts = await keyring.getNextPage();
      expect(accounts).toHaveLength(keyring.perPage);
      expect(accounts[0]?.address).toBe(fakeAccounts[0]);
      expect(accounts[1]?.address).toBe(fakeAccounts[1]);
      expect(accounts[2]?.address).toBe(fakeAccounts[2]);
      expect(accounts[3]?.address).toBe(fakeAccounts[3]);
      expect(accounts[4]?.address).toBe(fakeAccounts[4]);
    });

    it('should be able to advance to the next page', async function () {
      // manually advance 1 page
      await keyring.getNextPage();

      const accounts = await keyring.getNextPage();
      expect(accounts).toHaveLength(keyring.perPage);
      expect(accounts[0]?.address).toBe(fakeAccounts[keyring.perPage + 0]);
      expect(accounts[1]?.address).toBe(fakeAccounts[keyring.perPage + 1]);
      expect(accounts[2]?.address).toBe(fakeAccounts[keyring.perPage + 2]);
      expect(accounts[3]?.address).toBe(fakeAccounts[keyring.perPage + 3]);
      expect(accounts[4]?.address).toBe(fakeAccounts[keyring.perPage + 4]);
    });
  });

  describe('getPreviousPage', function () {
    it('should return the list of accounts for current page', async function () {
      // manually advance 1 page
      await keyring.getNextPage();
      const accounts = await keyring.getPreviousPage();

      expect(accounts).toHaveLength(keyring.perPage);
      expect(accounts[0]?.address).toBe(fakeAccounts[0]);
      expect(accounts[1]?.address).toBe(fakeAccounts[1]);
      expect(accounts[2]?.address).toBe(fakeAccounts[2]);
      expect(accounts[3]?.address).toBe(fakeAccounts[3]);
      expect(accounts[4]?.address).toBe(fakeAccounts[4]);
    });

    it('should be able to go back to the previous page', async function () {
      // manually advance 1 page
      await keyring.getNextPage();
      const accounts = await keyring.getPreviousPage();

      expect(accounts).toHaveLength(keyring.perPage);
      expect(accounts[0]?.address).toBe(fakeAccounts[0]);
      expect(accounts[1]?.address).toBe(fakeAccounts[1]);
      expect(accounts[2]?.address).toBe(fakeAccounts[2]);
      expect(accounts[3]?.address).toBe(fakeAccounts[3]);
      expect(accounts[4]?.address).toBe(fakeAccounts[4]);
    });
  });

  describe('getAccounts', function () {
    const accountIndex = 5;
    let accounts: string[] = [];
    beforeEach(async function () {
      keyring.setAccountToUnlock(accountIndex);
      await keyring.addAccounts();
      accounts = await keyring.getAccounts();
    });

    it('returns an array of accounts', function () {
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts).toHaveLength(1);
    });

    it('returns the expected', function () {
      const expectedAccount = fakeAccounts[accountIndex];
      expect(accounts[0]).toBe(expectedAccount);
    });
  });

  describe('signTransaction', function () {
    it('should pass serialized transaction to trezor and return signed tx', async function () {
      const ethereumSignTransactionStub = sinon.stub().resolves({
        success: true,
        payload: { v: '0x1', r: '0x0', s: '0x0' },
      });
      bridge.ethereumSignTransaction = ethereumSignTransactionStub;

      sinon.stub(fakeTx, 'verifySignature').callsFake(() => true);
      sinon
        .stub(fakeTx, 'getSenderAddress')
        .callsFake(() => Address.fromString(fakeAccounts[0]).toBuffer());

      const returnedTx = await keyring.signTransaction(fakeAccounts[0], fakeTx);
      // assert that the v,r,s values got assigned to tx.
      expect(returnedTx.v).toBeDefined();
      expect(returnedTx.r).toBeDefined();
      expect(returnedTx.s).toBeDefined();
      // ensure we get a older version transaction back
      expect((returnedTx as EthereumTx).getChainId()).toBe(1);
      expect((returnedTx as TypedTransaction).common).toBeUndefined();
      expect(ethereumSignTransactionStub.calledOnce).toBe(true);
    });

    it('should pass serialized newer transaction to trezor and return signed tx', async function () {
      sinon.stub(TransactionFactory, 'fromTxData').callsFake(() => {
        // without having a private key/public key pair in this test, we have
        // mock out this method and return the original tx because we can't
        // replicate r and s values without the private key.
        return newFakeTx;
      });

      const ethereumSignTransactionStub = sinon.stub().resolves({
        success: true,
        payload: { v: '0x25', r: '0x0', s: '0x0' },
      });
      bridge.ethereumSignTransaction = ethereumSignTransactionStub;

      sinon
        .stub(newFakeTx, 'getSenderAddress')
        .callsFake(() => Address.fromString(fakeAccounts[0]));
      sinon.stub(newFakeTx, 'verifySignature').callsFake(() => true);

      const returnedTx = await keyring.signTransaction(
        fakeAccounts[0],
        newFakeTx,
      );
      // ensure we get a new version transaction back
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect((returnedTx as EthereumTx).getChainId).toBeUndefined();
      expect(
        (returnedTx as TypedTransaction).common.chainId().toString(16),
      ).toBe('1');
      expect(ethereumSignTransactionStub.calledOnce).toBe(true);
    });

    it('should pass serialized contract deployment transaction to trezor and return signed tx', async function () {
      sinon.stub(TransactionFactory, 'fromTxData').callsFake(() => {
        // without having a private key/public key pair in this test, we have
        // mock out this method and return the original tx because we can't
        // replicate r and s values without the private key.
        return contractDeploymentFakeTx;
      });

      const ethereumSignTransactionStub = sinon.stub().resolves({
        success: true,
        payload: { v: '0x25', r: '0x0', s: '0x0' },
      });
      bridge.ethereumSignTransaction = ethereumSignTransactionStub;

      sinon
        .stub(contractDeploymentFakeTx, 'getSenderAddress')
        .callsFake(() => Address.fromString(fakeAccounts[0]));

      sinon
        .stub(contractDeploymentFakeTx, 'verifySignature')
        .callsFake(() => true);

      const returnedTx = await keyring.signTransaction(
        fakeAccounts[0],
        contractDeploymentFakeTx,
      );
      // ensure we get a new version transaction back
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect((returnedTx as EthereumTx).getChainId).toBeUndefined();
      expect(
        (returnedTx as TypedTransaction).common.chainId().toString(16),
      ).toBe('1');
      expect(ethereumSignTransactionStub.calledOnce).toBe(true);
      expect(ethereumSignTransactionStub.getCall(0).args[0]).toStrictEqual({
        path: `m/44'/60'/0'/0/0`,
        transaction: {
          ...contractDeploymentFakeTx.toJSON(),
          to: '0x',
          chainId: 1,
        },
      });
    });

    it('should pass correctly encoded EIP1559 transaction to trezor and return signed tx', async function () {
      // Copied from @MetaMask/eth-ledger-bridge-keyring
      // Generated by signing fakeTypeTwoTx with an unknown private key
      const expectedRSV = {
        v: '0x0',
        r: '0x5ffb3adeaec80e430e7a7b02d95c5108b6f09a0bdf3cf69869dc1b38d0fb8d3a',
        s: '0x28b234a5403d31564e18258df84c51a62683e3f54fa2b106fdc1a9058006a112',
      };
      // Override actual address of 0x391535104b6e0Ea6dDC2AD0158aB3Fbd7F04ed1B
      const fromTxDataStub = sinon.stub(TransactionFactory, 'fromTxData');
      fromTxDataStub.callsFake((...args) => {
        const tx = fromTxDataStub.wrappedMethod(...args);
        sinon
          .stub(tx, 'getSenderAddress')
          .returns(Address.fromString(fakeAccounts[0]));
        return tx;
      });

      const ethereumSignTransactionStub = sinon.stub().resolves({
        success: true,
        payload: expectedRSV,
      });
      bridge.ethereumSignTransaction = ethereumSignTransactionStub;

      const returnedTx = await keyring.signTransaction(
        fakeAccounts[0],
        fakeTypeTwoTx,
      );

      expect(ethereumSignTransactionStub.calledOnce).toBe(true);
      sinon.assert.calledWithExactly(ethereumSignTransactionStub, {
        path: "m/44'/60'/0'/0/0",
        transaction: {
          chainId: 1,
          nonce: '0x0',
          maxPriorityFeePerGas: '0x9184e72a000',
          maxFeePerGas: '0x19184e72a000',
          gasLimit: '0x2710',
          to: '0x0000000000000000000000000000000000000000',
          value: '0x0',
          data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
          accessList: [],
          v: '0x1',
          r: undefined,
          s: undefined,
        },
      });

      expect(returnedTx.toJSON()).toStrictEqual({
        ...fakeTypeTwoTx.toJSON(),
        ...expectedRSV,
      });
    });
  });

  describe('signMessage', function () {
    it('should call TrezorConnect.ethereumSignMessage', async function () {
      const ethereumSignMessageStub = sinon.stub().resolves({});
      bridge.ethereumSignMessage = ethereumSignMessageStub;

      try {
        await keyring.signMessage(fakeAccounts[0], 'some msg');
      } catch (error) {
        // Since we only care about ensuring our function gets called,
        // we want to ignore warnings due to stub data
      }

      expect(ethereumSignMessageStub.calledOnce).toBe(true);
    });
  });

  describe('signPersonalMessage', function () {
    it('should call TrezorConnect.ethereumSignMessage', async function () {
      const ethereumSignMessageStub = sinon.stub().resolves({});
      bridge.ethereumSignMessage = ethereumSignMessageStub;

      try {
        await keyring.signPersonalMessage(fakeAccounts[0], 'some msg');
      } catch (error) {
        // Since we only care about ensuring our function gets called,
        // we want to ignore warnings due to stub data
      }

      expect(ethereumSignMessageStub.calledOnce).toBe(true);
    });
  });

  describe('signTypedData', function () {
    it('should throw an error on signTypedData_v3 because it is not supported', async function () {
      let error: unknown = null;
      try {
        await keyring.signTypedData(
          String(null),
          {
            types: { EIP712Domain: [], EmptyMessage: [] },
            primaryType: 'EmptyMessage',
            domain: {},
            message: {},
          },
          {
            version: SignTypedDataVersion.V3,
          },
        );
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).toString()).toContain(
        'Only version 4 of typed data signing is supported',
      );
    });

    it('should call TrezorConnect.ethereumSignTypedData', async function () {
      const ethereumSignTypedDataStub = sinon.stub().resolves({
        success: true,
        payload: { signature: '0x00', address: fakeAccounts[0] },
      });
      bridge.ethereumSignTypedData = ethereumSignTypedDataStub;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore next-line
      // eslint-disable-next-line no-invalid-this
      this.timeout = 60000;
      await keyring.signTypedData(
        fakeAccounts[0],
        // Message with missing data that @metamask/eth-sig-util accepts
        {
          types: { EIP712Domain: [], EmptyMessage: [] },
          primaryType: 'EmptyMessage',
          domain: {},
          message: {},
        },
        { version: SignTypedDataVersion.V4 },
      );

      expect(ethereumSignTypedDataStub.calledOnce).toBe(true);
      sinon.assert.calledWithExactly(ethereumSignTypedDataStub, {
        path: "m/44'/60'/0'/0/0",
        data: {
          // Empty message that trezor-connect/EIP-712 spec accepts
          types: { EIP712Domain: [], EmptyMessage: [] },
          primaryType: 'EmptyMessage',
          domain: {},
          message: {},
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        metamask_v4_compat: true,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        domain_separator_hash:
          '6192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        message_hash:
          'c9e71eb57cf9fa86ec670283b58cb15326bb6933c8d8e2ecb2c0849021b3ef42',
      });
    });
  });

  describe('exportAccount', function () {
    it('should throw an error because it is not supported', async function () {
      let error: unknown = null;
      try {
        await keyring.exportAccount();
      } catch (e) {
        error = e;
      }

      expect(error instanceof Error).toBe(true);
      expect((error as Error).toString()).toBe(
        'Error: Not supported on this device',
      );
    });
  });

  describe('forgetDevice', function () {
    it('should clear the content of the keyring', async function () {
      // Add an account
      keyring.setAccountToUnlock(0);
      await keyring.addAccounts();

      // Wipe the keyring
      keyring.forgetDevice();

      const accounts = await keyring.getAccounts();

      expect(keyring.isUnlocked()).toBe(false);
      expect(accounts).toHaveLength(0);
    });
  });

  describe('setHdPath', function () {
    const initialProperties = {
      hdPath: `m/44'/60'/0'/0` as const,
      accounts: ['Account 1'],
      page: 2,
      perPage: 10,
    };
    const accountToUnlock = 1;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const mockPaths = { '0x123': 1 };

    beforeEach(function () {
      keyring.deserialize(initialProperties);
      keyring.paths = mockPaths;
      keyring.setAccountToUnlock(accountToUnlock.toString(16));
    });

    it('should do nothing if passed an hdPath equal to the current hdPath', async function () {
      keyring.setHdPath(initialProperties.hdPath);
      expect(keyring.hdPath).toBe(initialProperties.hdPath);
      expect(keyring.accounts).toStrictEqual(initialProperties.accounts);
      expect(keyring.page).toBe(initialProperties.page);
      expect(keyring.perPage).toBe(initialProperties.perPage);
      expect(keyring.hdk.publicKey.toString('hex')).toBe(
        fakeHdKey.publicKey.toString('hex'),
      );
      expect(keyring.unlockedAccount).toBe(accountToUnlock);
      expect(keyring.paths).toStrictEqual(mockPaths);
    });

    it('should update the hdPath and reset account and page properties if passed a new hdPath', async function () {
      const SLIP0044TestnetPath = `m/44'/1'/0'/0`;

      keyring.setHdPath(SLIP0044TestnetPath);

      expect(keyring.hdPath).toBe(SLIP0044TestnetPath);
      expect(keyring.accounts).toStrictEqual([]);
      expect(keyring.page).toBe(0);
      expect(keyring.perPage).toBe(5);
      expect(keyring.hdk.publicKey).toBeNull();
      expect(keyring.unlockedAccount).toBe(0);
      expect(keyring.paths).toStrictEqual({});
    });

    it('should throw an error if passed an unsupported hdPath', async function () {
      const unsupportedPath = 'unsupported hdPath';
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore next-line
        keyring.setHdPath(unsupportedPath);
      }).toThrow(
        `The setHdPath method does not support setting HD Path to ${unsupportedPath}`,
      );
    });
  });
});
