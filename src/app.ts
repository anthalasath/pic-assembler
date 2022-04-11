import { ethers } from "ethers";
import BreedableNFTArtifact from "../nft-maker/artifacts/contracts/BreedableNFT.sol/BreedableNFT.json";
import { BreedableNFT } from "../nft-maker/typechain-types";
import { program } from "commander";
import { getPicture } from "./pic-assembler";

require('dotenv').config();


async function main() {
  program
    .option("-n", "--network <string>")
    .option("-a", "--address <string>")
    .option("-t", "--tokenId <number>");

  program.parse();

  const [network, address, tokenId] = program.args;
  const provider = new ethers.providers.InfuraProvider(network, process.env.INFURA_PROJECT_ID);
  const breedableNFT = new ethers.Contract(address, BreedableNFTArtifact.abi, provider) as BreedableNFT;
  await getPicture(breedableNFT, tokenId);
}

main().catch(console.error);

