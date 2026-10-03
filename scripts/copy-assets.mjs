import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");

const sourceViews = path.join(root, "src", "views");
const sourcePublic = path.join(root, "src", "public");

const distViews = path.join(root, "dist", "views");
const distPublic = path.join(root, "dist", "public");

if (fs.existsSync(sourceViews)) {
    fs.cpSync(sourceViews, distViews, {
        recursive: true
    });

    console.log("✓ Views copied");
}

if (fs.existsSync(sourcePublic)) {
    fs.cpSync(sourcePublic, distPublic, {
        recursive: true
    });

    console.log("✓ Public files copied");
}