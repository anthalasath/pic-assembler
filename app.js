const sharp = require("sharp");

async function main() {
  await sharp("background.jpg")
    .composite([
      {
        input: "antha_dragon.png",
        top: 50,
        left: 50,
      },
    ])
    .toFile("output.png");
}

main().catch(console.error);

