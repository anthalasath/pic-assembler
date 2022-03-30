import sharp from "sharp";
import axios from "axios";
import path from "path";
import fs from "fs";

interface Vector2 {
  x: number
  y: number
}

interface PicturePart {
  position: Vector2
  uri: string
}

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

async function assemble(picturesByLayer: PicturePart[]): Promise<string> {
  const images = await Promise.all(picturesByLayer.map(async p => {
    const localFilePath = await download(p.uri);
    return { input: localFilePath, top: p.position.y, left: p.position.x };
  }));
  const outputFile = "output.png";
  await sharp("transparent_background.png")
    .composite(images)
    .toFile(outputFile);
  return outputFile;
}

function getRandomCoordinate(backgroundDimension: number) {
  return Math.round((Math.random() * backgroundDimension));
}

async function main() {
  const pictures = [
    "https://pbs.twimg.com/profile_images/740982631496458241/wfpy6yvg_400x400.jpg",
    "https://icon-library.com/images/doge-icon/doge-icon-21.jpg"
  ].map(uri => {
    return {
      position: { x:getRandomCoordinate(1920), y:getRandomCoordinate(1080) },
      uri
    };
  });
  await assemble(pictures);
}

main().catch(console.error);