import sharp from "sharp";
import axios from "axios";
import path from "path";
import fs from "fs";
import { BigNumberish, ethers } from "ethers";
import BreedableNFTArtifact from "./nft-maker/artifacts/contracts/BreedableNFT.sol/BreedableNFT.json";
import { BreedableNFT } from "./nft-maker/typechain-types";
import { PictureStructOutput } from "./nft-maker/typechain-types/contracts/BreedableNFT";
import { program } from "commander";

async function download(fileUrl: string): Promise<string> {
  // Get the file name
  const fileName = path.basename(fileUrl);
  const folder = "download";

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  // The path of the downloaded file on our machine
  const localFilePath = path.resolve(__dirname, folder, fileName);
  try {
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream',
    });
    const promise = new Promise<string>((res, rej) => {
      const w = response.data.pipe(fs.createWriteStream(localFilePath));
      w.on('finish', () => {
        res(localFilePath);
      });
    });
    return promise;
  } catch (err: any) {
    throw new Error(err);
  }
}

async function assemble(picturesByLayer: PictureStructOutput[]): Promise<string> {
  const images = await Promise.all(picturesByLayer.map(async p => {
    const localFilePath = await download(p.uri);
    return { input: localFilePath, top: p.position.y.toNumber(), left: p.position.x.toNumber() };
  }));
  const outputFile = "output.png";
  await sharp("transparent_background.png")
    .composite(images)
    .toFile(outputFile);
  return outputFile;
}

async function getPicture(breedableNFT: BreedableNFT, tokenId: BigNumberish): Promise<string> {
  const creature = await breedableNFT.getCreature(tokenId);
  const pictures: PictureStructOutput[] = await Promise.all(creature.genes.map((gene, i) => breedableNFT.getPicture(i, gene)));
  return assemble(pictures);
}

async function main() {
  program
    .option("-a", "--address <string>")
    .option("-t", "--tokenId <number>");

  program.parse();

  const [address, tokenId] = program.args;
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const breedableNFT = new ethers.Contract(address, BreedableNFTArtifact.abi, provider) as BreedableNFT;
  await getPicture(breedableNFT, tokenId);
}

main().catch(console.error);

