export interface ProgramChoice {
  value: string;
  label: string;
}

const NUMBERED_LINE = /^\s*(\d+)\s*[.)]\s+(.+?)\s*$/;

export function readProgramChoices(output: string): ProgramChoice[] {
  const lines = output.split("\n");
  const prompt = lines.at(-1) ?? "";
  const body = lines.slice(0, -1);
  const numbered: ProgramChoice[] = [];
  for (let index = body.length - 1; index >= 0; index -= 1) {
    const line = body[index] ?? "";
    if (line.trim() === "") {
      break;
    }
    const match = NUMBERED_LINE.exec(line);
    if (!match) {
      break;
    }
    numbered.push({ value: match[1] ?? "", label: line.trim() });
  }
  numbered.reverse();
  if (numbered.length > 0) {
    return numbered;
  }
  if (/yes\s*\/\s*no/i.test(prompt)) {
    return [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ];
  }
  return [];
}

export function readPrompt(output: string): string {
  const lastLine = output.split("\n").at(-1)?.trim() ?? "";
  return lastLine || "Your answer";
}
