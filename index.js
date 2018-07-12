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
const MAX_INDEX = 1000
const DELAY_BETWEEN_POPUPS = 1000

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
    return Promise.resolve()
  }

  isUnlocked () {
    return !!(this.hdk && this.hdk.publicKey)
  }

  unlock () {

    if (this.isUnlocked()) return Promise.resolve('already unlocked')

    return new Promise((resolve, reject) => {
      TrezorConnect.getXPubKey(
        this.hdPath,
        response => {
          if (response.success) {
            this.hdk.publicKey = new Buffer(response.publicKey, 'hex')
            this.hdk.chainCode = new Buffer(response.chainCode, 'hex')
            resolve('just unlocked')
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
      this.unlock()
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

  getFirstPage () {
    this.page = 0
    return this.__getPage(1)
  }

  getNextPage () {
    return this.__getPage(1)
  }

  getPreviousPage () {
    return this.__getPage(-1)
  }

  __getPage (increment) {

    this.page += increment

    if (this.page <= 0) { this.page = 1 }

    return new Promise((resolve, reject) => {
      this.unlock()
        .then(_ => {

          const from = (this.page - 1) * this.perPage
          const to = from + this.perPage

          const accounts = []

          for (let i = from; i < to; i++) {
            const address = this._addressFromIndex(pathBase, i)
             accounts.push({
              address: address,
              balance: null,
              index: i,
            })
            this.paths[ethUtil.toChecksumAddress(address)] = i

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

  removeAccount (address) {
    if (!this.accounts.map(a => a.toLowerCase()).includes(address.toLowerCase())) {
      throw new Error(`Address ${address} not found in this keyring`)
    }
    this.accounts = this.accounts.filter(a => a.toLowerCase() !== address.toLowerCase())
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction (address, tx) {

      return new Promise((resolve, reject) => {
        this.unlock()
          .then(status => {
            setTimeout(_ => {
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
                      reject('signature doesnt match the right address')
                    }

                    resolve(signedTx)

                  } else {
                      reject(response.error || 'Unknown error')
                  }
                },
                TREZOR_MIN_FIRMWARE_VERSION)

            // This is necessary to avoid popup collision
            // between the unlock & sign trezor popups
            }, status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0)

        })
      })
  }

  signMessage (withAccount, data) {
    throw new Error('Not supported on this device')
  }

  // For personal_sign, we need to prefix the message:
  signPersonalMessage (withAccount, message) {
    return new Promise((resolve, reject) => {
      this.unlock()
          .then(status => {
            setTimeout(_ => {
              const humanReadableMsg = this._toAscii(message)
              TrezorConnect.ethereumSignMessage(this._pathFromAddress(withAccount), humanReadableMsg, response => {
                if (response.success) {

                    const signature = `0x${response.signature}`
                    const addressSignedWith = sigUtil.recoverPersonalSignature({data: message, sig: signature})

                    if (ethUtil.toChecksumAddress(addressSignedWith) !== ethUtil.toChecksumAddress(withAccount)) {
                      reject('signature doesnt match the right address')
                    }

                    resolve(signature)

                } else {
                  reject(response.error || 'Unknown error')
                }

              }, TREZOR_MIN_FIRMWARE_VERSION)
            // This is necessary to avoid popup collision
            // between the unlock & sign trezor popups
            }, status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0)
        })
    })
  }

  signTypedData (withAccount, typedData) {
    // Waiting on trezor to enable this
    throw new Error('Not supported on this device')
  }

  exportAccount (address) {
    throw new Error('Not supported on this device')
  }

  forgetDevice () {
    this.accounts = []
    this.hdk = new HDKey()
    this.page = 0
    this.unlockedAccount = 0
    this.paths = {}
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
    const checksummedAddress = ethUtil.toChecksumAddress(address)
    let index = this.paths[checksummedAddress]
    if (typeof index === 'undefined') {
      for (let i = 0; i < MAX_INDEX; i++) {
        if (checksummedAddress === this._addressFromIndex(pathBase, i)) {
          index = i
          break
        }
      }
    }

    if (typeof index === 'undefined') {
      throw new Error('Unknown address')
    }
    return `${this.hdPath}/${index}`
  }

  _toAscii (hex) {
      let str = ''
      let i = 0; const l = hex.length
      if (hex.substring(0, 2) === '0x') {
          i = 2
      }
      for (; i < l; i += 2) {
          const code = parseInt(hex.substr(i, 2), 16)
          str += String.fromCharCode(code)
      }

      return str
  }
}

TrezorKeyring.type = keyringType
module.exports = TrezorKeyring
