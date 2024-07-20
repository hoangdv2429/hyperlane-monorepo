/* eslint-disable no-console */
import { expect } from 'chai';
import { ethers } from 'ethers';

import { TrustedRelayerIsm } from '@hyperlane-xyz/core';
import { Address } from '@hyperlane-xyz/utils';

import { HyperlaneProxyFactoryDeployer } from '../deploy/HyperlaneProxyFactoryDeployer.js';
import { MultiProvider } from '../providers/MultiProvider.js';

import { HyperlaneIsmFactory } from './HyperlaneIsmFactory.js';
import { IsmType, TrustedRelayerIsmConfig } from './types.js';
import { moduleMatchesConfig } from './utils.js';

describe('HyperlaneIsmFactory', function () {
  this.timeout(6000000); // Increase timeout to 60 seconds

  let ismFactory: HyperlaneIsmFactory;
  let multiProvider: MultiProvider;
  let ismFactoryDeployer: HyperlaneProxyFactoryDeployer;
  const chain = 'sepolia'; // Sepolia chain name

  beforeEach(async function () {
    this.timeout(6000000); // Increase timeout for beforeEach hook

    // Using the provided private key for the deployer
    const deployerPrivateKey = 'insert-private-key-here';
    const provider = new ethers.providers.JsonRpcProvider(
      'https://eth-sepolia.g.alchemy.com/v2/jWmA0ERPc0JdyMrZSEiM5lOBpEu2hD2l',
    );
    const signer = new ethers.Wallet(deployerPrivateKey, provider);

    multiProvider = MultiProvider.createTestMultiProvider({ signer });
    ismFactoryDeployer = new HyperlaneProxyFactoryDeployer(multiProvider);

    ismFactory = new HyperlaneIsmFactory(
      await ismFactoryDeployer.deploy(multiProvider.mapKnownChains(() => ({}))),
      multiProvider,
    );

    ismFactory.setDeployer(ismFactoryDeployer);
  });

  it('deploys a trusted relayer ism', async () => {
    // Sepolia addresses
    const mailboxAddress: Address =
      '0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766';
    const relayerAddress: Address =
      '0xC528714699D4f305f1157DD19Dee55D045Beb4C3';

    const config: TrustedRelayerIsmConfig = {
      type: IsmType.TRUSTED_RELAYER,
      relayer: relayerAddress,
    };

    const ism = (await ismFactory.deploy({
      destination: chain,
      config,
      mailbox: mailboxAddress,
    })) as TrustedRelayerIsm;

    const matches = await moduleMatchesConfig(
      chain,
      ism.address,
      config,
      ismFactory.multiProvider,
      ismFactory.getContracts(chain),
    );

    expect(matches).to.be.true;
  });
});
