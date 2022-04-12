import { ethers } from "ethers";
import BreedableNFTArtifact from "nft-maker/artifacts/contracts/BreedableNFT.sol/BreedableNFT.json";
import { BreedableNFT } from "nft-maker/typechain-types";
import { program } from "commander";
import { getPicture } from "./pic-assembler";
import {writeFileSync} from 'fs';

require('dotenv').config();


async function main() {
  program
    .option("-o", "--output <string>")
    .option("-n", "--network <string>")
    .option("-a", "--address <string>")
    .option("-t", "--tokenId <number>");

  program.parse();

  const [output, network, address, tokenId] = program.args;
  const provider = new ethers.providers.InfuraProvider(network, process.env.INFURA_PROJECT_ID);
  const breedableNFT = new ethers.Contract(address, BreedableNFTArtifact.abi, provider) as BreedableNFT;
  const buf = await getPicture(breedableNFT, tokenId);
  writeFileSync(output, buf);
}

main().catch(console.error);

