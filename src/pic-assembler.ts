import sharp from "sharp";
import axios from "axios";
import path from "path";
import fs from "fs";
import { BigNumberish } from "ethers";
import { BreedableNFT } from "nft-maker/typechain-types/contracts/BreedableNFT";
import { PictureStructOutput } from "nft-maker/typechain-types/contracts/BreedableNFT";

async function download(fileUrl: string): Promise<string> {
    // Get the file name
    const fileName = path.basename(fileUrl);
    const folder = "download";

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }

    // The path of the downloaded file on our machine
    const localFilePath = path.resolve(__dirname, folder, fileName);
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

export async function getPicture(breedableNFT: BreedableNFT, tokenId: BigNumberish): Promise<string> {
    const creature = await breedableNFT.getCreature(tokenId);
    const pictures: PictureStructOutput[] = await Promise.all(creature.genes.map((gene, i) => breedableNFT.getPicture(i, gene)));
    return assemble(pictures);
}