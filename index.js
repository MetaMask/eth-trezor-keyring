const { EventEmitter } = require('events')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const Transaction = require('ethereumjs-tx')
const HDKey = require('hdkey')
const TrezorConnect = require('./trezor-connect.js')

const hdPathString = `m/44'/60'/0'/0`
const keyringType = 'Trezor Hardware'
const pathBase = 'm'
const TREZOR_MIN_FIRMWARE_VERSION = '1.5.2'

class TrezorKeyring extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.type = keyringType
    this.accounts = []
    this.hdk = new HDKey()
    this.page = 0
    this.perPage = 5
    this.unlockedAccount = 0
    this.paths = {}
    this.deserialize(opts)
  }

  serialize () {
    return Promise.resolve({
      hdPath: this.hdPath,
      accounts: this.accounts,
      page: this.page,
      paths: this.paths,
      perPage: this.perPage,
      unlockedAccount: this.unlockedAccount,
    })
  }

  deserialize (opts = {}) {
    this.hdPath = opts.hdPath || hdPathString
    this.accounts = opts.accounts || []
    this.page = opts.page || 0
    this.perPage = opts.perPage || 5
    this.paths = opts.paths || {}
    return Promise.resolve()
  }

  unlock () {

    if (this.hdk.publicKey) return Promise.resolve()

    return new Promise((resolve, reject) => {
      TrezorConnect.getXPubKey(
        this.hdPath,
        response => {
          if (response.success) {
            this.hdk.publicKey = new Buffer(response.publicKey, 'hex')
            this.hdk.chainCode = new Buffer(response.chainCode, 'hex')
            resolve()
          } else {
            reject(response.error || 'Unknown error')
          }
        },
        TREZOR_MIN_FIRMWARE_VERSION
      )
    })
  }

  setAccountToUnlock (index) {
    this.unlockedAccount = parseInt(index, 10)
  }

  addAccounts (n = 1) {

    return new Promise((resolve, reject) => {
      return this.unlock()
        .then(_ => {
          const from = this.unlockedAccount
          const to = from + n
          this.accounts = []

          for (let i = from; i < to; i++) {
            const address = this._addressFromIndex(pathBase, i)
            this.accounts.push(address)
            this.page = 0
          }
          resolve(this.accounts)
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  getNextPage () {
    return this.__getPage(1)
  }

  getPreviousPage () {
    return this.__getPage(-1)
  }

  __getPage (increment) {

    this.page += increment

    return new Promise((resolve, reject) => {
      return this.unlock()
        .then(_ => {

          const from = this.page === 0 ? 0 : (this.page - 1) * this.perPage
          const to = from + this.perPage

          const accounts = []

          for (let i = from; i < to; i++) {
            const address = this._addressFromIndex(pathBase, i)
             accounts.push({
              address: address,
              balance: 0,
              index: i,
            })
            this.paths[address] = i

          }
          resolve(accounts)
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  getAccounts () {
    return Promise.resolve(this.accounts.slice())
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction (address, tx) {

      return new Promise((resolve, reject) => {

        TrezorConnect.ethereumSignTx(
          this._pathFromAddress(address),
          this._normalize(tx.nonce),
          this._normalize(tx.gasPrice),
          this._normalize(tx.gasLimit),
          this._normalize(tx.to),
          this._normalize(tx.value),
          this._normalize(tx.data),
          tx._chainId,
          response => {
            if (response.success) {

              tx.v = `0x${response.v.toString(16)}`
              tx.r = `0x${response.r}`
              tx.s = `0x${response.s}`

              const signedTx = new Transaction(tx)

              const addressSignedWith = ethUtil.toChecksumAddress(`0x${signedTx.from.toString('hex')}`)
              const correctAddress = ethUtil.toChecksumAddress(address)
              if (addressSignedWith !== correctAddress) {
                throw new Error('signature doesnt match the right address')
              }

              resolve(signedTx)

            } else {
                throw new Error(response.error || 'Unknown error')
            }
          },
          TREZOR_MIN_FIRMWARE_VERSION)
     })
  }

  signMessage (withAccount, data) {
    throw new Error('Not supported on this device')
  }

  // For personal_sign, we need to prefix the message:
  signPersonalMessage (withAccount, message) {
    return new Promise((resolve, reject) => {
      TrezorConnect.ethereumSignMessage(this._pathFromAddress(withAccount), message, response => {
        if (response.success) {

            const signature = this._personalToRawSig(response.signature)
            const addressSignedWith = sigUtil.recoverPersonalSignature({data: message, sig: signature})
            const correctAddress = ethUtil.toChecksumAddress(withAccount)
            if (addressSignedWith !== correctAddress) {
              throw new Error('signature doesnt match the right address')
            }
            resolve(signature)

        } else {
          throw new Error(response.error || 'Unknown error')
        }

      }, TREZOR_MIN_FIRMWARE_VERSION)
    })
  }

  signTypedData (withAccount, typedData) {
    // Waiting on trezor to enable this
    throw new Error('Not supported on this device')
  }

  exportAccount (address) {
    throw new Error('Not supported on this device')
  }

  /* PRIVATE METHODS */

  _padLeftEven (hex) {
    return hex.length % 2 !== 0 ? `0${hex}` : hex
  }

  _normalize (buf) {
    return this._padLeftEven(ethUtil.bufferToHex(buf).substring(2).toLowerCase())
  }

  _addressFromIndex (pathBase, i) {
    const dkey = this.hdk.derive(`${pathBase}/${i}`)
    const address = ethUtil
      .publicToAddress(dkey.publicKey, true)
      .toString('hex')
    return ethUtil.toChecksumAddress(address)
  }

  _pathFromAddress (address) {
    const index = this.paths[address]
    return `${this.hdPath}/${index}`
  }

  _personalToRawSig (signature) {
    var v = signature['v'] - 27
    v = v.toString(16)
    if (v.length < 2) {
      v = '0' + v
    }
    return '0x' + signature['r'] + signature['s'] + v
  }
}

TrezorKeyring.type = keyringType
module.exports = TrezorKeyring
