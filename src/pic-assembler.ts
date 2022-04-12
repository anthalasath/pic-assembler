import sharp from "sharp";
import axios from "axios";
import path from "path";
import fs from "fs";
import { BigNumberish } from "ethers";
import { BreedableNFT } from "nft-maker/typechain-types/contracts/BreedableNFT";
import { PictureStructOutput } from "nft-maker/typechain-types/contracts/BreedableNFT";


async function download(fileUrl: string): Promise<Buffer> {
    const response = await axios({
        method: "GET",
        url: fileUrl,
        responseType: "arraybuffer",
    });
    const arrBuff = response.data;
    const buf = Buffer.alloc(arrBuff.byteLength);
    const uintArr = new Uint8Array(arrBuff);
    for (let i = 0; i < buf.length; i++) {
        buf[i] = uintArr[i];
    }
    return buf;
}

async function assemble(picturesByLayer: PictureStructOutput[]): Promise<Buffer> {
    const images = await Promise.all(picturesByLayer.map(async p => {
        const buf = await download(p.uri);
        return { input: buf, top: p.position.y.toNumber(), left: p.position.x.toNumber() };
    }));
    return sharp("transparent_background.png")
        .composite(images)
        .toBuffer();
}

export async function getPicture(breedableNFT: BreedableNFT, tokenId: BigNumberish): Promise<Buffer> {
    const creature = await breedableNFT.getCreature(tokenId);
    const pictures: PictureStructOutput[] = await Promise.all(creature.genes.map((gene, i) => breedableNFT.getPicture(i, gene)));
    return assemble(pictures);
}