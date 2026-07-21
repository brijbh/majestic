import type { RepositoryRef } from "../transit/model";

const ownerOrRepo = "[A-Za-z0-9._-]+";
const repoPattern = new RegExp(`^(${ownerOrRepo})\\/(${ownerOrRepo})\\/?$`);

export function parseRepositoryInput(input: string): RepositoryRef {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Enter a public GitHub repository as owner/name or a GitHub URL.");
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  if (/^[a-z]+:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Enter a public GitHub repository as owner/name or a GitHub URL.");
  }

  const path = withoutProtocol.replace(/^github\.com\//i, "");
  if (
    withoutProtocol.includes("/") &&
    !withoutProtocol.toLowerCase().startsWith("github.com/") &&
    /^.+\..+\//.test(withoutProtocol)
  ) {
    throw new Error("Majestic V1 supports public GitHub repositories only.");
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length !== 2) {
    throw new Error("Enter a public GitHub repository as owner/name or a GitHub URL.");
  }

  const normalized = `${segments[0]}/${segments[1]}`;
  const match = repoPattern.exec(normalized);
  if (!match) {
    throw new Error("Enter a public GitHub repository as owner/name or a GitHub URL.");
  }

  return { owner: match[1].toLowerCase(), name: match[2] };
}
