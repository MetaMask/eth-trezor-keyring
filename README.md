# eth-trezor-keyring

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
- The method `signPersonalMessage` requires the firmware version 2.0.7+ for TREZOR Model T and 1.6.2+ on TREZOR ONE
- As of `trezor-connect`: `8.2.2`, passing an EIP-1559 transaction to `signTransaction`
  requires the firmware version 2.4.2+ for TREZOR Model T, and version 1.10.4+ for TREZOR ONE.

## Installation

`yarn add @metamask/eth-trezor-keyring`

or

`npm install @metamask/eth-trezor-keyring`

## Using

In addition to all the known methods from the [Keyring class protocol](https://github.com/MetaMask/eth-simple-keyring#the-keyring-class-protocol),
there are a few others:

- **isUnlocked** : Returns true if we have the public key in memory, which allows to generate the list of accounts at any time

- **unlock** : Connects to the TREZOR device and exports the extended public key, which is later used to read the available ethereum addresses inside the trezor account.

- **setAccountToUnlock** : the index of the account that you want to unlock in order to use with the signTransaction and signPersonalMessage methods

- **getFirstPage** : returns the first ordered set of accounts from the TREZOR account

- **getNextPage** : returns the next ordered set of accounts from the TREZOR account based on the current page

- **getPreviousPage** : returns the previous ordered set of accounts from the TREZOR account based on the current page

- **forgetDevice** : removes all the device info from memory so the next interaction with the keyring will prompt the user to connect the TREZOR device and export the account information

## Contributing

### Setup

- Install [Node.js](https://nodejs.org) version 18
  - If you are using [nvm](https://github.com/creationix/nvm#installation) (recommended) running `nvm use` will automatically choose the right node version for you.
- Install [Yarn v3](https://yarnpkg.com/getting-started/install)
- Run `yarn install` to install dependencies and run any required post-install scripts
  - **Warning:** Do not use the `yarn` / `yarn install` command directly. Use `yarn setup` instead. The normal install command will skip required post-install scripts, leaving your development environment in an invalid state.

### Testing and Linting

Run `yarn test` to run the tests.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.

### Release & Publishing

The project follows the same release process as the other libraries in the MetaMask organization. The GitHub Actions [`action-create-release-pr`](https://github.com/MetaMask/action-create-release-pr) and [`action-publish-release`](https://github.com/MetaMask/action-publish-release) are used to automate the release process; see those repositories for more information about how they work.

1. Choose a release version.

   - The release version should be chosen according to SemVer. Analyze the changes to see whether they include any breaking changes, new features, or deprecations, then choose the appropriate SemVer version. See [the SemVer specification](https://semver.org/) for more information.

2. If this release is backporting changes onto a previous release, then ensure there is a major version branch for that version (e.g. `1.x` for a `v1` backport release).

   - The major version branch should be set to the most recent release with that major version. For example, when backporting a `v1.0.2` release, you'd want to ensure there was a `1.x` branch that was set to the `v1.0.1` tag.

3. Trigger the [`workflow_dispatch`](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#workflow_dispatch) event [manually](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow) for the `Create Release Pull Request` action to create the release PR.

   - For a backport release, the base branch should be the major version branch that you ensured existed in step 2. For a normal release, the base branch should be the main branch for that repository (which should be the default value).
   - This should trigger the [`action-create-release-pr`](https://github.com/MetaMask/action-create-release-pr) workflow to create the release PR.

4. Update the changelog to move each change entry into the appropriate change category ([See here](https://keepachangelog.com/en/1.0.0/#types) for the full list of change categories, and the correct ordering), and edit them to be more easily understood by users of the package.

   - Generally any changes that don't affect consumers of the package (e.g. lockfile changes or development environment changes) are omitted. Exceptions may be made for changes that might be of interest despite not having an effect upon the published package (e.g. major test improvements, security improvements, improved documentation, etc.).
   - Try to explain each change in terms that users of the package would understand (e.g. avoid referencing internal variables/concepts).
   - Consolidate related changes into one change entry if it makes it easier to explain.
   - Run `yarn auto-changelog validate --rc` to check that the changelog is correctly formatted.

5. Review and QA the release.

   - If changes are made to the base branch, the release branch will need to be updated with these changes and review/QA will need to restart again. As such, it's probably best to avoid merging other PRs into the base branch while review is underway.

6. Squash & Merge the release.

   - This should trigger the [`action-publish-release`](https://github.com/MetaMask/action-publish-release) workflow to tag the final release commit and publish the release on GitHub.

7. Publish the release on npm.

   - Be very careful to use a clean local environment to publish the release, and follow exactly the same steps used during CI.
   - Use `npm publish --dry-run` to examine the release contents to ensure the correct files are included. Compare to previous releases if necessary (e.g. using `https://unpkg.com/browse/[package name]@[package version]/`).
   - Once you are confident the release contents are correct, publish the release using `npm publish`.

## Attributions

This code was inspired by [eth-ledger-keyring](https://github.com/jamespic/eth-ledger-keyring) and [eth-hd-keyring](https://github.com/MetaMask/eth-hd-keyring)
