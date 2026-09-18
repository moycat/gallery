import { createHash } from "node:crypto";
import { posix } from "node:path";

export function versionedAssetPath(path: string, content: string): string {
  const extension = posix.extname(path);
  const name = path.slice(0, path.length - extension.length);
  const version = createHash("sha256").update(content).digest("hex").slice(0, 16);

  return `${name}.${version}${extension}`;
}
