import { randomInt } from "crypto";

export class JobCodeGenerator {
  private static readonly ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  generate(length = 6): string {
    let code = "";
    for (let i = 0; i < length; i++) {
      code += JobCodeGenerator.ALPHABET[randomInt(JobCodeGenerator.ALPHABET.length)];
    }
    return code;
  }

  generateUnique(count: number, taken: Set<string> = new Set()): string[] {
    const codes: string[] = [];
    while (codes.length < count) {
      const code = this.generate();
      if (!taken.has(code)) {
        taken.add(code);
        codes.push(code);
      }
    }
    return codes;
  }
}
