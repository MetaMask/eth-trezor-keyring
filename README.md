eth-trezor-keyring [![CircleCI](https://circleci.com/gh/brunobar79/eth-trezor-keyring.svg?style=svg)](https://circleci.com/gh/brunobar79/eth-trezor-keyring)
==================

An implementation of MetaMask's [Keyring interface](https://github.com/MetaMask/eth-simple-keyring#the-keyring-class-protocol), that uses a trezor hardware
wallet for all cryptographic operations.

In most regards, it works in the same way as
[eth-hd-keyring](https://github.com/MetaMask/eth-hd-keyring), but using a Trezor
device. However there are a number of differences:

- Because the keys are stored in the device, operations that rely on the device
  will fail if there is no Trezor device attached, or a different Trezor device
  is attached.
- It does not support the `signMessage`, `signTypedData` or `exportAccount`
  methods, because Trezor devices do not support these operations.
- The method `signPersonalMessage` will be enabled in the next version of the trezor firmware based on  [this conversation](https://github.com/trezor/connect/issues/109#issuecomment-396217063))

Using
-----

In addition to all the known methods from the [Keyring class protocol](https://github.com/MetaMask/eth-simple-keyring#the-keyring-class-protocol),
there are a few others:

- **unlock** : Connects to the trezor device and exports the extended public key, which is later used to read the available ethereum addresses inside the trezor account.

- **setAccountToUnlock** : the index of the account that you want to unlock in order to use with the signTransaction and signPersonalMessage methods

- **getPage** : returns an ordered set of accounts from the Trezor account 

Testing
-------
Work in progress, but you can run it like this:

```
npm test
```



Attributions
-------
This code was inspired by [eth-ledger-keyring](https://github.com/jamespic/eth-ledger-keyring) and [eth-hd-keyring](https://github.com/MetaMask/eth-hd-keyring)