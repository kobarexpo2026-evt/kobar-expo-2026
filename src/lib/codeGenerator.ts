/**
 * Generator Kode Undangan KOBAR EXPO
 * Karakter: Huruf besar dan angka TANPA 0, O, 1, I
 * Panjang: 8 karakter
 * Unik di semua event
 */

const ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateSingleCode(): string {
  let result = '';
  const charLength = ALLOWED_CHARS.length;
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * charLength);
    result += ALLOWED_CHARS[randomIndex];
  }
  return result;
}

export function generateBatchCodes(count: number): string[] {
  const safeCount = Math.min(Math.max(1, count), 1000);
  const codeSet = new Set<string>();

  while (codeSet.size < safeCount) {
    codeSet.add(generateSingleCode());
  }

  return Array.from(codeSet);
}
