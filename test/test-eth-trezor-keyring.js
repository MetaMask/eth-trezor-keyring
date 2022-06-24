global.window = require('./window.shim');
global.navigator = require('./navigator.shim');
global.self = require('./self.shim');

const assert = require('assert').strict;
const chai = require('chai');
const spies = require('chai-spies');
const sinon = require('sinon');

const EthereumTx = require('ethereumjs-tx');
const HDKey = require('hdkey');
const TrezorConnect = require('@trezor/connect').default;
const {
  TransactionFactory,
  FeeMarketEIP1559Transaction,
} = require('@ethereumjs/tx');
const { default: Common, Chain, Hardfork } = require('@ethereumjs/common');

const TrezorKeyring = require('..');

const SIGNING_DELAY = 20;

const { expect } = chai;

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
];

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

chai.use(spies);

describe('TrezorKeyring', function () {
  let keyring;

  beforeEach(async function () {
    keyring = new TrezorKeyring();
    keyring.hdk = fakeHdKey;
  });

  afterEach(function () {
    if (keyring) {
      keyring.dispose();
    }
    sinon.restore();
  });

  describe('Keyring.type', function () {
    it('is a class property that returns the type string.', function () {
      const { type } = TrezorKeyring;
      assert.equal(typeof type, 'string');
    });

    it('returns the correct value', function () {
      const { type } = keyring;
      const correct = TrezorKeyring.type;
      assert.equal(type, correct);
    });
  });

  describe('constructor', function () {
    it('constructs', function (done) {
      const t = new TrezorKeyring({ hdPath: `m/44'/60'/0'/0` });
      assert.equal(typeof t, 'object');
      t.getAccounts().then((accounts) => {
        assert.equal(Array.isArray(accounts), true);
        done();
      });
    });
  });

  describe('serialize', function () {
    it('serializes an instance', function (done) {
      keyring.serialize().then((output) => {
        assert.equal(output.page, 0);
        assert.equal(output.hdPath, `m/44'/60'/0'/0`);
        assert.equal(Array.isArray(output.accounts), true);
        assert.equal(output.accounts.length, 0);
        done();
      });
    });
  });

  describe('deserialize', function () {
    it('serializes what it deserializes', function (done) {
      const someHdPath = `m/44'/60'/0'/1`;
      keyring
        .deserialize({
          page: 10,
          hdPath: someHdPath,
          accounts: [],
        })
        .then(() => {
          return keyring.serialize();
        })
        .then((serialized) => {
          assert.equal(serialized.accounts.length, 0, 'restores 0 accounts');
          assert.equal(serialized.page, 10, 'restores page');
          assert.equal(serialized.hdPath, someHdPath, 'restores hdPath');
          done();
        });
    });
  });

  describe('isUnlocked', function () {
    it('should return true if we have a public key', function () {
      assert.equal(keyring.isUnlocked(), true);
    });
  });

  describe('unlock', function () {
    it('should resolve if we have a public key', function (done) {
      keyring.unlock().then((_) => {
        done();
      });
    });

    it('should call TrezorConnect.getPublicKey if we dont have a public key', async function () {
      sinon
        .stub(TrezorConnect, 'getPublicKey')
        .callsFake(() => Promise.resolve({}));
      keyring.hdk = new HDKey();
      try {
        await keyring.unlock();
      } catch (e) {
        // Since we only care about ensuring our function gets called,
        // we want to ignore warnings due to stub data
      }
      assert(TrezorConnect.getPublicKey.calledOnce);
    });
  });

  describe('setAccountToUnlock', function () {
    it('should set unlockedAccount', function () {
      keyring.setAccountToUnlock(3);
      assert.equal(keyring.unlockedAccount, 3);
    });
  });

  describe('addAccounts', function () {
    describe('with no arguments', function () {
      it('returns a single account', function (done) {
        keyring.setAccountToUnlock(0);
        keyring.addAccounts().then((accounts) => {
          assert.equal(accounts.length, 1);
          done();
        });
      });

      it('returns the custom accounts desired', async function () {
        keyring.setAccountToUnlock(0);
        await keyring.addAccounts();
        keyring.setAccountToUnlock(2);
        const accounts = await keyring.addAccounts();
        assert.equal(accounts[0], fakeAccounts[0]);
        assert.equal(accounts[1], fakeAccounts[2]);
      });
    });

    describe('with a numeric argument', function () {
      it('returns that number of accounts', function (done) {
        keyring.setAccountToUnlock(0);
        keyring.addAccounts(5).then((accounts) => {
          assert.equal(accounts.length, 5);
          done();
        });
      });

      it('returns the expected accounts', function (done) {
        keyring.setAccountToUnlock(0);
        keyring.addAccounts(3).then((accounts) => {
          assert.equal(accounts[0], fakeAccounts[0]);
          assert.equal(accounts[1], fakeAccounts[1]);
          assert.equal(accounts[2], fakeAccounts[2]);
          done();
        });
      });
    });
  });

  describe('removeAccount', function () {
    describe('if the account exists', function () {
      it('should remove that account', function (done) {
        keyring.setAccountToUnlock(0);
        keyring.addAccounts().then(async (accounts) => {
          assert.equal(accounts.length, 1);
          keyring.removeAccount(fakeAccounts[0]);
          const accountsAfterRemoval = await keyring.getAccounts();
          assert.equal(accountsAfterRemoval.length, 0);
          done();
        });
      });

      it('should remove only the account requested', async function () {
        keyring.setAccountToUnlock(0);
        await keyring.addAccounts();
        keyring.setAccountToUnlock(1);
        await keyring.addAccounts();

        let accounts = await keyring.getAccounts();
        assert.equal(accounts.length, 2);

        keyring.removeAccount(fakeAccounts[0]);
        accounts = await keyring.getAccounts();

        assert.equal(accounts.length, 1);
        assert.equal(accounts[0], fakeAccounts[1]);
      });
    });

    describe('if the account does not exist', function () {
      it('should throw an error', function () {
        const unexistingAccount = '0x0000000000000000000000000000000000000000';
        expect((_) => {
          keyring.removeAccount(unexistingAccount);
        }).to.throw(`Address ${unexistingAccount} not found in this keyring`);
      });
    });
  });

  describe('getFirstPage', function () {
    it('should set the currentPage to 1', async function () {
      await keyring.getFirstPage();
      assert.equal(keyring.page, 1);
    });

    it('should return the list of accounts for current page', async function () {
      const accounts = await keyring.getFirstPage();

      expect(accounts.length, keyring.perPage);
      expect(accounts[0].address, fakeAccounts[0]);
      expect(accounts[1].address, fakeAccounts[1]);
      expect(accounts[2].address, fakeAccounts[2]);
      expect(accounts[3].address, fakeAccounts[3]);
      expect(accounts[4].address, fakeAccounts[4]);
    });
  });

  describe('getNextPage', function () {
    it('should return the list of accounts for current page', async function () {
      const accounts = await keyring.getNextPage();
      expect(accounts.length, keyring.perPage);
      expect(accounts[0].address, fakeAccounts[0]);
      expect(accounts[1].address, fakeAccounts[1]);
      expect(accounts[2].address, fakeAccounts[2]);
      expect(accounts[3].address, fakeAccounts[3]);
      expect(accounts[4].address, fakeAccounts[4]);
    });

    it('should be able to advance to the next page', async function () {
      // manually advance 1 page
      await keyring.getNextPage();

      const accounts = await keyring.getNextPage();
      expect(accounts.length, keyring.perPage);
      expect(accounts[0].address, fakeAccounts[keyring.perPage + 0]);
      expect(accounts[1].address, fakeAccounts[keyring.perPage + 1]);
      expect(accounts[2].address, fakeAccounts[keyring.perPage + 2]);
      expect(accounts[3].address, fakeAccounts[keyring.perPage + 3]);
      expect(accounts[4].address, fakeAccounts[keyring.perPage + 4]);
    });
  });

  describe('getPreviousPage', function () {
    it('should return the list of accounts for current page', async function () {
      // manually advance 1 page
      await keyring.getNextPage();
      const accounts = await keyring.getPreviousPage();

      expect(accounts.length, keyring.perPage);
      expect(accounts[0].address, fakeAccounts[0]);
      expect(accounts[1].address, fakeAccounts[1]);
      expect(accounts[2].address, fakeAccounts[2]);
      expect(accounts[3].address, fakeAccounts[3]);
      expect(accounts[4].address, fakeAccounts[4]);
    });

    it('should be able to go back to the previous page', async function () {
      // manually advance 1 page
      await keyring.getNextPage();
      const accounts = await keyring.getPreviousPage();

      expect(accounts.length, keyring.perPage);
      expect(accounts[0].address, fakeAccounts[0]);
      expect(accounts[1].address, fakeAccounts[1]);
      expect(accounts[2].address, fakeAccounts[2]);
      expect(accounts[3].address, fakeAccounts[3]);
      expect(accounts[4].address, fakeAccounts[4]);
    });
  });

  describe('getAccounts', function () {
    const accountIndex = 5;
    let accounts = [];
    beforeEach(async function () {
      keyring.setAccountToUnlock(accountIndex);
      await keyring.addAccounts();
      accounts = await keyring.getAccounts();
    });

    it('returns an array of accounts', function () {
      assert.equal(Array.isArray(accounts), true);
      assert.equal(accounts.length, 1);
    });

    it('returns the expected', function () {
      const expectedAccount = fakeAccounts[accountIndex];
      assert.equal(accounts[0], expectedAccount);
    });
  });

  describe('signTransaction', function () {
    it('should pass serialized transaction to trezor and return signed tx', async function () {
      sinon.stub(TrezorConnect, 'ethereumSignTransaction').callsFake(() => {
        return Promise.resolve({
          success: true,
          payload: { v: '0x1', r: '0x0', s: '0x0' },
        });
      });
      sinon.stub(fakeTx, 'verifySignature').callsFake(() => true);
      sinon.stub(fakeTx, 'getSenderAddress').callsFake(() => fakeAccounts[0]);

      const returnedTx = await keyring.signTransaction(fakeAccounts[0], fakeTx);
      // assert that the v,r,s values got assigned to tx.
      assert.ok(returnedTx.v);
      assert.ok(returnedTx.r);
      assert.ok(returnedTx.s);
      // ensure we get a older version transaction back
      assert.equal(returnedTx.getChainId(), 1);
      assert.equal(returnedTx.common, undefined);
      assert(TrezorConnect.ethereumSignTransaction.calledOnce);
    });

    it('should pass serialized newer transaction to trezor and return signed tx', async function () {
      sinon.stub(TransactionFactory, 'fromTxData').callsFake(() => {
        // without having a private key/public key pair in this test, we have
        // mock out this method and return the original tx because we can't
        // replicate r and s values without the private key.
        return newFakeTx;
      });

      sinon.stub(TrezorConnect, 'ethereumSignTransaction').callsFake(() => {
        return Promise.resolve({
          success: true,
          payload: { v: '0x25', r: '0x0', s: '0x0' },
        });
      });

      sinon
        .stub(newFakeTx, 'getSenderAddress')
        .callsFake(() => fakeAccounts[0]);
      sinon.stub(newFakeTx, 'verifySignature').callsFake(() => true);

      const returnedTx = await keyring.signTransaction(
        fakeAccounts[0],
        newFakeTx,
      );
      // ensure we get a new version transaction back
      assert.equal(returnedTx.getChainId, undefined);
      assert.equal(returnedTx.common.chainIdBN().toString('hex'), '1');
      assert(TrezorConnect.ethereumSignTransaction.calledOnce);
    });

    it('should pass serialized contract deployment transaction to trezor and return signed tx', async function () {
      sinon.stub(TransactionFactory, 'fromTxData').callsFake(() => {
        // without having a private key/public key pair in this test, we have
        // mock out this method and return the original tx because we can't
        // replicate r and s values without the private key.
        return contractDeploymentFakeTx;
      });

      sinon.stub(TrezorConnect, 'ethereumSignTransaction').callsFake(() => {
        return Promise.resolve({
          success: true,
          payload: { v: '0x25', r: '0x0', s: '0x0' },
        });
      });

      sinon
        .stub(contractDeploymentFakeTx, 'getSenderAddress')
        .callsFake(() => fakeAccounts[0]);

      sinon
        .stub(contractDeploymentFakeTx, 'verifySignature')
        .callsFake(() => true);

      const returnedTx = await keyring.signTransaction(
        fakeAccounts[0],
        contractDeploymentFakeTx,
      );
      // ensure we get a new version transaction back
      assert.equal(returnedTx.getChainId, undefined);
      assert.equal(returnedTx.common.chainIdBN().toString('hex'), '1');
      assert(TrezorConnect.ethereumSignTransaction.calledOnce);
      assert.deepEqual(
        TrezorConnect.ethereumSignTransaction.getCall(0).args[0],
        {
          path: `m/44'/60'/0'/0/0`,
          transaction: {
            ...contractDeploymentFakeTx.toJSON(),
            to: '0x',
            chainId: 1,
          },
        },
      );
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
      sinon.stub(TransactionFactory, 'fromTxData').callsFake((...args) => {
        const tx = TransactionFactory.fromTxData.wrappedMethod(...args);
        sinon.stub(tx, 'getSenderAddress').returns(fakeAccounts[0]);
        return tx;
      });

      sinon
        .stub(TrezorConnect, 'ethereumSignTransaction')
        .callsFake((params) => {
          expect(params.transaction).to.be.an('object');
          // chainId must be a number, unlike other variables which can be hex-strings
          expect(params.transaction)
            .to.have.property('chainId')
            .to.satisfy(Number.isInteger);
          expect(params.transaction).to.have.property('maxFeePerGas');
          expect(params.transaction).to.have.property('maxPriorityFeePerGas');
          expect(params.transaction).to.not.have.property('gasPrice');
          return Promise.resolve({
            success: true,
            payload: expectedRSV,
          });
        });

      const returnedTx = await keyring.signTransaction(
        fakeAccounts[0],
        fakeTypeTwoTx,
        commonEIP1559,
      );

      assert(TrezorConnect.ethereumSignTransaction.calledOnce);
      expect(returnedTx.toJSON()).to.deep.equal({
        ...fakeTypeTwoTx.toJSON(),
        ...expectedRSV,
      });
    });
  });

  describe('signMessage', function () {
    it('should call TrezorConnect.ethereumSignMessage', function (done) {
      sinon
        .stub(TrezorConnect, 'ethereumSignMessage')
        .callsFake(() => Promise.resolve({}));

      keyring.signMessage(fakeAccounts[0], 'some msg').catch((_) => {
        // Since we only care about ensuring our function gets called,
        // we want to ignore warnings due to stub data
      });

      setTimeout(() => {
        assert(TrezorConnect.ethereumSignMessage.calledOnce);
        done();
      }, SIGNING_DELAY);
    });
  });

  describe('signPersonalMessage', function () {
    it('should call TrezorConnect.ethereumSignMessage', function (done) {
      sinon
        .stub(TrezorConnect, 'ethereumSignMessage')
        .callsFake(() => Promise.resolve({}));

      keyring.signPersonalMessage(fakeAccounts[0], 'some msg').catch((_) => {
        // Since we only care about ensuring our function gets called,
        // we want to ignore warnings due to stub data
      });

      setTimeout(() => {
        setTimeout(() => {
          assert(TrezorConnect.ethereumSignMessage.calledOnce);
          done();
        });
      }, SIGNING_DELAY);
    });
  });

  describe('signTypedData', function () {
    it('should throw an error on signTypedData_v3 because it is not supported', async function () {
      let error = null;
      try {
        await keyring.signTypedData(null, null, { version: 'V3' });
      } catch (e) {
        error = e;
      }

      expect(error).to.be.an.instanceof(Error);
      expect(error.toString()).to.contain(
        'Only version 4 of typed data signing is supported',
      );
    });

    it('should call TrezorConnect.ethereumSignTypedData', async function () {
      sinon
        .stub(TrezorConnect, 'ethereumSignTypedData')
        .callsFake(async () => ({
          success: true,
          payload: { signature: '0x00', address: fakeAccounts[0] },
        }));

      this.timeout = 60000;
      await keyring.signTypedData(
        fakeAccounts[0],
        // Message with missing data that @metamask/eth-sig-util accepts
        { types: { EmptyMessage: [] }, primaryType: 'EmptyMessage' },
        { version: 'V4' },
      );

      assert(TrezorConnect.ethereumSignTypedData.calledOnce);
      sinon.assert.calledWithExactly(TrezorConnect.ethereumSignTypedData, {
        path: "m/44'/60'/0'/0/0",
        data: {
          // Empty message that trezor-connect/EIP-712 spec accepts
          types: { EIP712Domain: [], EmptyMessage: [] },
          primaryType: 'EmptyMessage',
          domain: {},
          message: {},
        },
        metamask_v4_compat: true,
        domain_separator_hash:
          '6192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1',
        message_hash:
          'c9e71eb57cf9fa86ec670283b58cb15326bb6933c8d8e2ecb2c0849021b3ef42',
      });
    });
  });

  describe('exportAccount', function () {
    it('should throw an error because it is not supported', async function () {
      let error = null;
      try {
        await keyring.exportAccount();
      } catch (e) {
        error = e;
      }

      expect(error instanceof Error, true);
      expect(error.toString(), 'Not supported on this device');
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

      assert.equal(keyring.isUnlocked(), false);
      assert.equal(accounts.length, 0);
    });
  });

  describe('setHdPath', function () {
    const initialProperties = {
      hdPath: `m/44'/60'/0'/0`,
      accounts: ['Account 1'],
      page: 2,
      perPage: 10,
    };
    const accountToUnlock = 1;
    const mockPaths = { '0x123': 1 };

    beforeEach(function () {
      keyring.deserialize(initialProperties);
      keyring.paths = mockPaths;
      keyring.setAccountToUnlock(accountToUnlock.toString(16));
    });

    it('should do nothing if passed an hdPath equal to the current hdPath', async function () {
      keyring.setHdPath(initialProperties.hdPath);
      assert.equal(keyring.hdPath, initialProperties.hdPath);
      assert.deepEqual(keyring.accounts, initialProperties.accounts);
      assert.equal(keyring.page, initialProperties.page);
      assert.equal(keyring.perPage, initialProperties.perPage);
      assert.equal(
        keyring.hdk._publicKey.toString('hex'),
        fakeHdKey._publicKey.toString('hex'),
      );
      assert.equal(keyring.unlockedAccount, accountToUnlock);
      assert.deepEqual(keyring.paths, mockPaths);
    });

    it('should update the hdPath and reset account and page properties if passed a new hdPath', async function () {
      const SLIP0044TestnetPath = `m/44'/1'/0'/0`;

      keyring.setHdPath(SLIP0044TestnetPath);

      assert.equal(keyring.hdPath, SLIP0044TestnetPath);
      assert.deepEqual(keyring.accounts, []);
      assert.equal(keyring.page, 0);
      assert.equal(keyring.perPage, 5);
      assert.equal(keyring.hdk._publicKey, null);
      assert.equal(keyring.unlockedAccount, 0);
      assert.deepEqual(keyring.paths, {});
    });

    it('should throw an error if passed an unsupported hdPath', async function () {
      const unsupportedPath = 'unsupported hdPath';
      try {
        keyring.setHdPath(unsupportedPath);
      } catch (error) {
        assert.equal(
          error.message,
          `The setHdPath method does not support setting HD Path to ${unsupportedPath}`,
        );
      }
    });
  });
});
