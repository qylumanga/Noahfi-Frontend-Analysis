export async function sha256(input: string | ArrayBuffer): Promise<string> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256File(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  return sha256(buffer);
}

export function blockMaterial(previousHash: string, documentHash: string, actorId: string, action: string, timestamp: string): string {
  return previousHash + documentHash + actorId + action + timestamp;
}
