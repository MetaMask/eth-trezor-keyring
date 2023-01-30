# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.11.0]
### Uncategorized
- Update @ethereumjs/util, @ethereumjs/tx, @metamask/eth-sig-util ([#146](https://github.com/MetaMask/eth-trezor-keyring/pull/146))
- deps: @trezor/connect v9 ([#133](https://github.com/MetaMask/eth-trezor-keyring/pull/133))
- remove quotation mark from build-lint-test workflow name ([#154](https://github.com/MetaMask/eth-trezor-keyring/pull/154))
- Update Github actions to match module template ([#148](https://github.com/MetaMask/eth-trezor-keyring/pull/148))
- Yarn v3 ([#150](https://github.com/MetaMask/eth-trezor-keyring/pull/150))
- Bump json5 from 1.0.1 to 1.0.2 ([#147](https://github.com/MetaMask/eth-trezor-keyring/pull/147))
- Bump qs from 6.5.2 to 6.5.3 ([#145](https://github.com/MetaMask/eth-trezor-keyring/pull/145))
- Bump @metamask/auto-changelog from 3.0.0 to 3.1.0 ([#144](https://github.com/MetaMask/eth-trezor-keyring/pull/144))
- Bump @metamask/auto-changelog from 2.6.1 to 3.0.0 ([#139](https://github.com/MetaMask/eth-trezor-keyring/pull/139))
- Bump Node to v14 ([#135](https://github.com/MetaMask/eth-trezor-keyring/pull/135))
- Bump @metamask/auto-changelog from 2.5.0 to 2.6.1 ([#131](https://github.com/MetaMask/eth-trezor-keyring/pull/131))
- Bump protobufjs from 6.11.2 to 6.11.3 ([#130](https://github.com/MetaMask/eth-trezor-keyring/pull/130))
- Bump cross-fetch from 3.1.4 to 3.1.5 ([#126](https://github.com/MetaMask/eth-trezor-keyring/pull/126))
- Bump @metamask/eth-sig-util from 4.0.0 to 4.0.1 ([#125](https://github.com/MetaMask/eth-trezor-keyring/pull/125))
- Bump pathval from 1.1.0 to 1.1.1 ([#119](https://github.com/MetaMask/eth-trezor-keyring/pull/119))
- Bump minimist from 1.2.5 to 1.2.6 ([#124](https://github.com/MetaMask/eth-trezor-keyring/pull/124))
- doc: EIP-1559 is supported by Trezor Model 1 ([#122](https://github.com/MetaMask/eth-trezor-keyring/pull/122))

### Changed
- **BREAKING:** Removed support for Node v12 in favor of v14 ([#137](https://github.com/MetaMask/eth-json-rpc-middleware/pull/137))

## [0.10.0]
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

[Unreleased]: https://github.com/MetaMask/eth-trezor-keyring/compare/v0.11.0...HEAD
[0.11.0]: https://github.com/MetaMask/eth-trezor-keyring/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/MetaMask/eth-trezor-keyring/compare/v0.9.1...v0.10.0
[0.9.1]: https://github.com/MetaMask/eth-trezor-keyring/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/MetaMask/eth-trezor-keyring/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/MetaMask/eth-trezor-keyring/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/MetaMask/eth-trezor-keyring/releases/tag/v0.7.0
