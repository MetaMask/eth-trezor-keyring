const fs = require('fs')
const path = require('path')
const chai = require('chai')
const spies = require('chai-spies');
const {expect}  = chai;
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const EthereumTx = require('ethereumjs-tx')
const assert = require('assert')
const HDKey = require('hdkey');

const TrezorConnect = require('../trezor-connect.js')

const TrezorKeyring = require('../')

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
    '0x41bEAD6585eCA6c79B553Ca136f0DFA78A006899' 
];

const fakeXPubKey = 'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsApME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt'
const fakeHdKey = HDKey.fromExtendedKey(fakeXPubKey)


chai.use(spies);

describe('TrezorKeyring', function () {
    
    let keyring

    beforeEach(async function() {
        keyring = new TrezorKeyring()
        keyring.hdk = fakeHdKey;      
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
        it('serializes what it deserializes', function(done) {
            
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
                done()
            })
        })
    })

    describe('unlock', function() {
        it('should resolve if we have a public key', function(done){
            keyring.unlock().then( _ => {
                done()
            })
        })
        
        chai.spy.on(TrezorConnect, 'getXPubKey');

        it('should call TrezorConnect.getXPubKey if we dont have a public key', function(){
            keyring.hdk = new HDKey()
            expect(TrezorConnect.getXPubKey).to.have.been.called;
        })
    })

    describe('setAccountToUnlock', function() {
        it('should set unlockedAccount', function(){
            keyring.setAccountToUnlock(3)
            assert.equal(keyring.unlockedAccount, 3);
        });
    });

    describe('addAccounts', function() {
        describe('with no arguments', function() {
            it('returns a single account', function(done) {
                keyring.setAccountToUnlock(0)
                keyring.addAccounts()
                .then((accounts) => {
                    assert.equal(accounts.length, 1)
                    done()
                })
            })
        })

        describe('with a numeric argument', function() {
            it('returns that number of accounts', function(done) {
                keyring.setAccountToUnlock(0)
                keyring.addAccounts(5)
                .then((accounts) => {
                    assert.equal(accounts.length, 5)
                    done()
                })
            })

            it('returns the expected accounts', function(done) {
                keyring.setAccountToUnlock(0)
                keyring.addAccounts(3)
                .then((accounts) => {
                    assert.equal(accounts[0], fakeAccounts[0]);
                    assert.equal(accounts[1], fakeAccounts[1]);
                    assert.equal(accounts[2], fakeAccounts[2]);
                    done()
                })
            })
        })      
    })

    describe('getPage', function() {
          
    })

    describe('getAccounts', async function() {
        let accountIndex = 5;
        let accounts = [];
        beforeEach(async function() {
            keyring.setAccountToUnlock(accountIndex);
            await keyring.addAccounts()
            accounts = await keyring.getAccounts();
        })

        it('returns an array of accounts', function() {
            assert.equal(Array.isArray(accounts), true)
            assert.equal(accounts.length, 1)
        })

        it('returns the expected', function() {
            const expectedAccount = fakeAccounts[accountIndex]
            assert.equal(accounts[0], expectedAccount)  
        })
    })

    describe('signTransaction', function() {
        
    })

    describe('signMessage', function() {
        it('should throw an error because it is not supported', function(){
            expect( _ => {
                keyring.signMessage();
            }).to.throw('Not supported on this device')
        })
    })

    describe('signPersonalMessage', function() {
         
    })

    describe('signTypedData', function () {
        it('should throw an error because it is not supported', function(){
            expect( _ => {
                keyring.signTypedData();
            }).to.throw('Not supported on this device')
        })
    })
    
    describe('exportAccount', function () {
        it('should throw an error because it is not supported', function(){
            expect( _ => {
                keyring.exportAccount();
            }).to.throw('Not supported on this device')
        })
    })

   

    

    

})
