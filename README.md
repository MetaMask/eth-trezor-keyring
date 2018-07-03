eth-trezor-keyring [![CircleCI](https://circleci.com/gh/brunobar79/eth-trezor-keyring.svg?style=svg)](https://circleci.com/gh/brunobar79/eth-trezor-keyring)
==================

An implementation of MetaMask's [Keyring interface](https://github.com/MetaMask/eth-simple-keyring#the-keyring-class-protocol), that uses a TREZOR hardware
wallet for all cryptographic operations.

In most regards, it works in the same way as
[eth-hd-keyring](https://github.com/MetaMask/eth-hd-keyring), but using a TREZOR
device. However there are a number of differences:

- Because the keys are stored in the device, operations that rely on the device
  will fail if there is no TREZOR device attached, or a different TREZOR device
  is attached.
- It does not support the `signMessage`, `signTypedData` or `exportAccount`
  methods, because TREZOR devices do not support these operations.
- The method `signPersonalMessage` will be enabled in the next version of the TREZOR firmware > 2.0.7 (Model T) and 1.6.2+ on TREZOR ONE

Using
-----

In addition to all the known methods from the [Keyring class protocol](https://github.com/MetaMask/eth-simple-keyring#the-keyring-class-protocol),
there are a few others:

- **unlock** : Connects to the TREZOR device and exports the extended public key, which is later used to read the available ethereum addresses inside the trezor account.

- **setAccountToUnlock** : the index of the account that you want to unlock in order to use with the signTransaction and signPersonalMessage methods

- **getNextPage** : returns the next ordered set of accounts from the TREZOR account based on the current page

- **getPreviousPage** : returns the previous ordered set of accounts from the TREZOR account based on the current page

Testing
-------
Run the following command:

```
npm test
```



Attributions
-------
This code was inspired by [eth-ledger-keyring](https://github.com/jamespic/eth-ledger-keyring) and [eth-hd-keyring](https://github.com/MetaMask/eth-hd-keyring)
