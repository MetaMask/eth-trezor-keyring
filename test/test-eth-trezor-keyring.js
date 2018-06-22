const fs = require('fs')
const path = require('path')
const {expect} = require('chai')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const EthereumTx = require('ethereumjs-tx')
const assert = require('assert')
const TrezorKeyring = require('../')


describe('TrezorKeyring', function () {
    
    let keyring
    beforeEach(async function() {
        keyring = new TrezorKeyring()
    })
    
    describe('Keyring.type', function() {
        it('is a class property that returns the type string.', function() {
            const type = TrezorKeyring.type
            assert.equal(typeof type, 'string')
        })
        
        it('returns the correct value', function() {
            const type = keyring.type
            const correct = TrezorKeyring.type
            assert.equal(type, correct)
        })
    })

    describe('constructor', function() {
        it('constructs',  function(done) {
            const t = new TrezorKeyring({hdPath: `m/44'/60'/0'/0`});
            assert.equal(typeof t, 'object');
            t.getAccounts()
            .then(accounts => {
                assert.equal(Array.isArray(accounts), true);
                done()
            })
        })
    })

    describe('serialize', function() {
        it('serializes an instance', function(done) {
            keyring.serialize()
            .then((output) => {
              assert.equal(output.page, 0)
              assert.equal(output.hdPath, `m/44'/60'/0'/0`)
              assert.equal(Array.isArray(output.accounts), true);
              assert.equal(output.accounts.length, 0)
              done()
            })
          })
    })

    describe('deserialize', function() {
        it('serializes what it deserializes', function() {
            
            const someHdPath = `m/44'/60'/0'/1`;

            keyring.deserialize({
                page: 10,
                hdPath: someHdPath,
                accounts: []
            })
            .then(() => {
                return keyring.serialize()
            }).then((serialized) => {
                assert.equal(serialized.accounts.length, 0, 'restores 0 accounts')
                assert.equal(serialized.page, 10, 'restores page')
                assert.equal(serialized.hdPath, someHdPath, 'restores hdPath')
               
            })
        })
    })

    describe('#addAccounts', function() {
        
    })

    describe('#getAccounts', function() {
    
    })

    describe('#signPersonalMessage', function () {

    })

    describe('#signTypedData', function () {
    
    })

    describe('#unlock', function() {
    
    })

    describe('#setAccountToUnlock', function() {
    
    })

    describe('#getPage', function() {
    
    })

})
