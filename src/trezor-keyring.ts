import { EventEmitter } from 'events';
import * as ethUtil from '@ethereumjs/util';
import HDKey from 'hdkey';
import type {
  EthereumTransactionEIP1559,
  EthereumSignedTx,
  EthereumTransaction,
} from '@trezor/connect-web';
import { TransactionFactory } from '@ethereumjs/tx';
import type { TypedTransaction, TxData } from '@ethereumjs/tx';
import type OldEthJsTransaction from 'ethereumjs-tx';
import { transformTypedData } from '@trezor/connect-plugin-ethereum';
import {
  TypedMessage,
  SignTypedDataVersion,
  MessageTypes,
} from '@metamask/eth-sig-util';
import { TrezorBridge } from './trezor-bridge';

const hdPathString = `m/44'/60'/0'/0`;
const SLIP0044TestnetPath = `m/44'/1'/0'/0`;
const legacyMewPath = `m/44'/60'/0'`;

const ALLOWED_HD_PATHS = {
  [hdPathString]: true,
  [legacyMewPath]: true,
  [SLIP0044TestnetPath]: true,
} as const;

const keyringType = 'Trezor Hardware';
const pathBase = 'm';
const MAX_INDEX = 1000;
const DELAY_BETWEEN_POPUPS = 1000;
export const TREZOR_CONNECT_MANIFEST = {
  email: 'support@metamask.io',
  appUrl: 'https://metamask.io',
};

export interface TrezorControllerOptions {
  hdPath?: string;
  accounts?: string[];
  page?: number;
  perPage?: number;
}

export interface TrezorControllerState {
  hdPath: string;
  accounts: readonly string[];
  page: number;
  paths: Record<string, number>;
  perPage: number;
  unlockedAccount: number;
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if the given transaction is made with ethereumjs-tx or @ethereumjs/tx
 *
 * Transactions built with older versions of ethereumjs-tx have a
 * getChainId method that newer versions do not.
 * Older versions are mutable
 * while newer versions default to being immutable.
 * Expected shape and type
 * of data for v, r and s differ (Buffer (old) vs BN (new)).
 *
 * @param tx
 * @returns Returns `true` if tx is an old-style ethereumjs-tx transaction.
 */
function isOldStyleEthereumjsTx(
  tx: TypedTransaction | OldEthJsTransaction,
): tx is OldEthJsTransaction {
  return typeof (tx as OldEthJsTransaction).getChainId === 'function';
}

export class TrezorKeyring extends EventEmitter {
  static type: string = keyringType;

  readonly type: string = keyringType;

  accounts: readonly string[] = [];

  hdk: HDKey = new HDKey();

  hdPath: string = hdPathString;

  page = 0;

  perPage = 5;

  unlockedAccount = 0;

  paths: Record<string, number> = {};

  bridge: TrezorBridge;

  constructor({ bridge }: { bridge: TrezorBridge }) {
    super();

    if (!bridge) {
      throw new Error('Bridge is a required dependency for the keyring');
    }

    this.bridge = bridge;
  }

  /**
   * Gets the model, if known.
   * This may be `undefined` if the model hasn't been loaded yet.
   *
   * @returns
   */
  getModel(): string | undefined {
    return this.bridge.model;
  }

  init() {
    return this.bridge.init({
      manifest: TREZOR_CONNECT_MANIFEST,
      lazyLoad: true,
    });
  }

  async destroy() {
    return this.bridge.dispose();
  }

  async serialize(): Promise<TrezorControllerState> {
    return Promise.resolve({
      hdPath: this.hdPath,
      accounts: this.accounts,
      page: this.page,
      paths: this.paths,
      perPage: this.perPage,
      unlockedAccount: this.unlockedAccount,
    });
  }

  async deserialize(opts: TrezorControllerOptions = {}) {
    this.hdPath = opts.hdPath ?? hdPathString;
    this.accounts = opts.accounts ?? [];
    this.page = opts.page ?? 0;
    this.perPage = opts.perPage ?? 5;
    return Promise.resolve();
  }

  isUnlocked() {
    return Boolean(this.hdk?.publicKey);
  }

  async unlock() {
    if (this.isUnlocked()) {
      return Promise.resolve('already unlocked');
    }
    return new Promise((resolve, reject) => {
      this.bridge
        .getPublicKey({
          path: this.hdPath,
          coin: 'ETH',
        })
        .then((response) => {
          if (response.success) {
            this.hdk.publicKey = Buffer.from(response.payload.publicKey, 'hex');
            this.hdk.chainCode = Buffer.from(response.payload.chainCode, 'hex');
            resolve('just unlocked');
          } else {
            reject(new Error(response.payload?.error || 'Unknown error'));
          }
        })
        .catch((e) => {
          reject(new Error(e?.toString() || 'Unknown error'));
        });
    });
  }

  setAccountToUnlock(index: number | string) {
    this.unlockedAccount = parseInt(String(index), 10);
  }

  async addAccounts(n = 1): Promise<readonly string[]> {
    return new Promise((resolve, reject) => {
      this.unlock()
        .then((_) => {
          const from = this.unlockedAccount;
          const to = from + n;

          for (let i = from; i < to; i++) {
            const address = this.#addressFromIndex(pathBase, i);
            if (!this.accounts.includes(address)) {
              this.accounts = [...this.accounts, address];
            }
            this.page = 0;
          }
          resolve(this.accounts);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  async getFirstPage() {
    this.page = 0;
    return this.#getPage(1);
  }

  async getNextPage() {
    return this.#getPage(1);
  }

  async getPreviousPage() {
    return this.#getPage(-1);
  }

  async #getPage(
    increment: number,
  ): Promise<{ address: string; balance: number | null; index: number }[]> {
    this.page += increment;

    if (this.page <= 0) {
      this.page = 1;
    }

    return new Promise((resolve, reject) => {
      this.unlock()
        .then((_) => {
          const from = (this.page - 1) * this.perPage;
          const to = from + this.perPage;

          const accounts = [];

          for (let i = from; i < to; i++) {
            const address = this.#addressFromIndex(pathBase, i);
            accounts.push({
              address,
              balance: null,
              index: i,
            });
            this.paths[ethUtil.toChecksumAddress(address)] = i;
          }
          resolve(accounts);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  async getAccounts() {
    return Promise.resolve(this.accounts.slice());
  }

  removeAccount(address: string) {
    if (
      !this.accounts.map((a) => a.toLowerCase()).includes(address.toLowerCase())
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }

    this.accounts = this.accounts.filter(
      (a) => a.toLowerCase() !== address.toLowerCase(),
    );
  }

  /**
   * Signs a transaction using Trezor.
   *
   * Accepts either an ethereumjs-tx or @ethereumjs/tx transaction, and returns
   * the same type.
   *
   * @param address - Hex string address.
   * @param tx - Instance of either new-style or old-style ethereumjs transaction.
   * @returns The signed transaction, an instance of either new-style or old-style
   * ethereumjs transaction.
   */
  async signTransaction(
    address: string,
    tx: TypedTransaction | OldEthJsTransaction,
  ) {
    if (isOldStyleEthereumjsTx(tx)) {
      // In this version of ethereumjs-tx we must add the chainId in hex format
      // to the initial v value. The chainId must be included in the serialized
      // transaction which is only communicated to ethereumjs-tx in this
      // value. In newer versions the chainId is communicated via the 'Common'
      // object.
      return this.#signTransaction(
        address,
        // @types/ethereumjs-tx and old ethereumjs-tx versions document
        // this function return value as Buffer, but the actual
        // Transaction._chainId will always be a number.
        // See https://github.com/ethereumjs/ethereumjs-tx/blob/v1.3.7/index.js#L126
        tx.getChainId() as unknown as number,
        tx,
        (payload) => {
          tx.v = Buffer.from(payload.v, 'hex');
          tx.r = Buffer.from(payload.r, 'hex');
          tx.s = Buffer.from(payload.s, 'hex');
          return tx;
        },
      );
    }
    return this.#signTransaction(
      address,
      Number(tx.common.chainId()),
      tx,
      (payload) => {
        // Because tx will be immutable, first get a plain javascript object that
        // represents the transaction. Using txData here as it aligns with the
        // nomenclature of ethereumjs/tx.
        const txData: TxData = tx.toJSON();
        // The fromTxData utility expects a type to support transactions with a type other than 0
        txData.type = tx.type;
        // The fromTxData utility expects v,r and s to be hex prefixed
        txData.v = ethUtil.addHexPrefix(payload.v);
        txData.r = ethUtil.addHexPrefix(payload.r);
        txData.s = ethUtil.addHexPrefix(payload.s);
        // Adopt the 'common' option from the original transaction and set the
        // returned object to be frozen if the original is frozen.
        return TransactionFactory.fromTxData(txData, {
          common: tx.common,
          freeze: Object.isFrozen(tx),
        });
      },
    );
  }

  /**
   *
   * @param address - Hex string address.
   * @param chainId - Chain ID
   * @param tx - Instance of either new-style or old-style ethereumjs transaction.
   * @param handleSigning - Converts signed transaction
   * to the same new-style or old-style ethereumjs-tx.
   * @returns The signed transaction, an instance of either new-style or old-style
   * ethereumjs transaction.
   */
  async #signTransaction<T extends TypedTransaction | OldEthJsTransaction>(
    address: string,
    chainId: number,
    tx: T,
    handleSigning: (tx: EthereumSignedTx) => T,
  ): Promise<T> {
    let transaction: EthereumTransaction | EthereumTransactionEIP1559;
    if (isOldStyleEthereumjsTx(tx)) {
      // legacy transaction from ethereumjs-tx package has no .toJSON() function,
      // so we need to convert to hex-strings manually manually
      transaction = {
        to: this.#normalize(tx.to),
        value: this.#normalize(tx.value),
        data: this.#normalize(tx.data),
        chainId,
        nonce: this.#normalize(tx.nonce),
        gasLimit: this.#normalize(tx.gasLimit),
        gasPrice: this.#normalize(tx.gasPrice),
      };
    } else {
      // new-style transaction from @ethereumjs/tx package
      // we can just copy tx.toJSON() for everything except chainId, which must be a number
      transaction = {
        ...tx.toJSON(),
        chainId,
        to: this.#normalize(ethUtil.toBuffer(tx.to)),
      } as EthereumTransaction | EthereumTransactionEIP1559;
    }

    try {
      const status = await this.unlock();
      await wait(status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0);
      const response = await this.bridge.ethereumSignTransaction({
        path: this.#pathFromAddress(address),
        transaction,
      });
      if (response.success) {
        const newOrMutatedTx = handleSigning(response.payload);

        const addressSignedWith = ethUtil.toChecksumAddress(
          ethUtil.addHexPrefix(
            newOrMutatedTx.getSenderAddress().toString('hex'),
          ),
        );
        const correctAddress = ethUtil.toChecksumAddress(address);
        if (addressSignedWith !== correctAddress) {
          throw new Error("signature doesn't match the right address");
        }

        return newOrMutatedTx;
      }
      throw new Error(response.payload?.error || 'Unknown error');
    } catch (e) {
      throw new Error(e?.toString() ?? 'Unknown error');
    }
  }

  async signMessage(withAccount: string, data: string) {
    return this.signPersonalMessage(withAccount, data);
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage(withAccount: string, message: string) {
    return new Promise((resolve, reject) => {
      this.unlock()
        .then((status) => {
          setTimeout(
            () => {
              this.bridge
                .ethereumSignMessage({
                  path: this.#pathFromAddress(withAccount),
                  message: ethUtil.stripHexPrefix(message),
                  hex: true,
                })
                .then((response) => {
                  if (response.success) {
                    if (
                      response.payload.address !==
                      ethUtil.toChecksumAddress(withAccount)
                    ) {
                      reject(
                        new Error('signature doesnt match the right address'),
                      );
                    }
                    const signature = `0x${response.payload.signature}`;
                    resolve(signature);
                  } else {
                    reject(
                      new Error(response.payload?.error || 'Unknown error'),
                    );
                  }
                })
                .catch((e) => {
                  reject(new Error(e?.toString() || 'Unknown error'));
                });
              // This is necessary to avoid popup collision
              // between the unlock & sign trezor popups
            },
            status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0,
          );
        })
        .catch((e) => {
          reject(new Error(e?.toString() || 'Unknown error'));
        });
    });
  }

  /**
   * EIP-712 Sign Typed Data
   */
  async signTypedData<T extends MessageTypes>(
    address: string,
    data: TypedMessage<T>,
    { version }: { version: SignTypedDataVersion },
  ) {
    const dataWithHashes = transformTypedData(data, version === 'V4');

    // set default values for signTypedData
    // Trezor is stricter than @metamask/eth-sig-util in what it accepts
    const {
      types,
      message = {},
      domain = {},
      primaryType,
      // snake_case since Trezor uses Protobuf naming conventions here
      domain_separator_hash, // eslint-disable-line camelcase
      message_hash, // eslint-disable-line camelcase
    } = dataWithHashes;

    // This is necessary to avoid popup collision
    // between the unlock & sign trezor popups
    const status = await this.unlock();
    await wait(status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0);

    const response = await this.bridge.ethereumSignTypedData({
      path: this.#pathFromAddress(address),
      data: {
        types: { ...types, EIP712Domain: types.EIP712Domain ?? [] },
        message,
        domain,
        primaryType,
      },
      metamask_v4_compat: true, // eslint-disable-line camelcase
      // Trezor 1 only supports blindly signing hashes
      domain_separator_hash, // eslint-disable-line camelcase
      message_hash: message_hash ?? '', // eslint-disable-line camelcase
    });

    if (response.success) {
      if (ethUtil.toChecksumAddress(address) !== response.payload.address) {
        throw new Error('signature doesnt match the right address');
      }
      return response.payload.signature;
    }

    throw new Error(response.payload?.error || 'Unknown error');
  }

  async exportAccount() {
    return Promise.reject(new Error('Not supported on this device'));
  }

  forgetDevice() {
    this.accounts = [];
    this.hdk = new HDKey();
    this.page = 0;
    this.unlockedAccount = 0;
    this.paths = {};
  }

  /**
   * Set the HD path to be used by the keyring. Only known supported HD paths are allowed.
   *
   * If the given HD path is already the current HD path, nothing happens. Otherwise the new HD
   * path is set, and the wallet state is completely reset.
   *
   * @throws {Error] Throws if the HD path is not supported.
   *
   * @param hdPath - The HD path to set.
   */
  setHdPath(hdPath: keyof typeof ALLOWED_HD_PATHS) {
    if (!ALLOWED_HD_PATHS[hdPath]) {
      throw new Error(
        `The setHdPath method does not support setting HD Path to ${hdPath}`,
      );
    }

    // Reset HDKey if the path changes
    if (this.hdPath !== hdPath) {
      this.hdk = new HDKey();
      this.accounts = [];
      this.page = 0;
      this.perPage = 5;
      this.unlockedAccount = 0;
      this.paths = {};
    }
    this.hdPath = hdPath;
  }

  #normalize(buf: Buffer) {
    return ethUtil.bufferToHex(buf).toString();
  }

  #addressFromIndex(basePath: string, i: number) {
    const dkey = this.hdk.derive(`${basePath}/${i}`);
    const address = ethUtil
      .publicToAddress(dkey.publicKey, true)
      .toString('hex');
    return ethUtil.toChecksumAddress(`0x${address}`);
  }

  #pathFromAddress(address: string) {
    const checksummedAddress = ethUtil.toChecksumAddress(address);
    let index = this.paths[checksummedAddress];
    if (typeof index === 'undefined') {
      for (let i = 0; i < MAX_INDEX; i++) {
        if (checksummedAddress === this.#addressFromIndex(pathBase, i)) {
          index = i;
          break;
        }
      }
    }

    if (typeof index === 'undefined') {
      throw new Error('Unknown address');
    }
    return `${this.hdPath}/${index}`;
  }
}
