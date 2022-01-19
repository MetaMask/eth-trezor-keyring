# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Support for EIP-721 signTypedData_v4 ([#117](https://github.com/MetaMask/eth-trezor-keyring/pull/117))

## [0.9.1]
### Changed
- Update trezor connect to 8.2.3, so that 1.10.4 of the Model One firmware is supported ([#115](https://github.com/MetaMask/eth-trezor-keyring/pull/115))

## [0.9.0]
### Added
- Add dispose method, which exposes the TrezorConnect.dispose method, allowing consumers to explictly remove the Trezor Connect iframe ([#113](https://github.com/MetaMask/eth-trezor-keyring/pull/13))

### Fixed
- Fixed the signing of contract creation transactions, which require a nullish (empty string or undefined) `to` parameter ([#112](https://github.com/MetaMask/eth-trezor-keyring/pull/112))

## [0.8.0]
### Added
- Support for EIP-1559 transactions for the Model T ([#108](https://github.com/MetaMask/eth-trezor-keyring/pull/108))
- Add setHdPath method, which allows setting the HD path used by the keyring to known, supported HD paths ([#107](https://github.com/MetaMask/eth-trezor-keyring/pull/107))

## [0.7.0]
### Added
- Support new versions of ethereumjs/tx ([#88](https://github.com/MetaMask/eth-trezor-keyring/pull/88))

[Unreleased]: https://github.com/metamask/eth-trezor-keyring/compare/v0.9.1...HEAD
[0.9.1]: https://github.com/metamask/eth-trezor-keyring/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/metamask/eth-trezor-keyring/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/metamask/eth-trezor-keyring/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/metamask/eth-trezor-keyring/releases/tag/v0.7.0
