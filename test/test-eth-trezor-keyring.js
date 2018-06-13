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

    describe('constructor', function(done) {
        it('constructs', function async (done) {
            const obj = new TrezorKeyring({hdPath: `m/44'/60'/0'/0`})
            assert.equal(typeof obj, 'object')
            done()
        })
    })

    describe('Keyring.type', function() {
        it('is a class property that returns the type string.', function() {
            const type = TrezorKeyring.type
            assert.equal(typeof type, 'string')
        })
    })

    describe('#type', function() {
        it('returns the correct value', function() {
            const type = keyring.type
            const correct = TrezorKeyring.type
            assert.equal(type, correct)
        })
    })

    describe('#serialize', function() {

    })

    describe('#deserialize', function() {
   
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
