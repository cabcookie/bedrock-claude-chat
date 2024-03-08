import sharp from "sharp";
import fs from "fs";
import path from "path";

// Define the source image and the output directory
const sourceImagePath = "bedrock-claude-chat.png";
const outputDirectory = "../frontend/public";

// Define the sizes of the favicons you want to generate
const faviconSizes = [16, 32, 48, 64, 96, 128, 192, 256];

// Ensure the output directory exists
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}

// Function to resize and save a favicon
const resizeAndSaveFavicon = (size) => {
  const outputPath = path.join(outputDirectory, `favicon-${size}x${size}.png`);

  sharp(sourceImagePath)
    .resize(size, size)
    .toFile(outputPath, (err) => {
      if (err) {
        console.error(
          `Failed to generate favicon of size ${size}x${size}`,
          err
        );
      } else {
        console.log(`Generated favicon of size ${size}x${size}`);
      }
    });
};

// Generate all favicons
faviconSizes.forEach(resizeAndSaveFavicon);
