import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatJSONString(str: string, indent = 2) {
  try {
    const obj = JSON.parse(str);
    if (obj.answer || obj.text || obj.response) {
      const mainText = obj.answer || obj.text || obj.response;
      const rest = { ...obj };
      delete rest.answer;
      delete rest.text;
      delete rest.response;
      return (
        mainText +
        (Object.keys(rest).length > 0
          ? "\n\n" + JSON.stringify(rest, null, indent)
          : "")
      );
    }
    return JSON.stringify(obj, null, indent);
  } catch {
    return str;
  }
}

export function formatMarkdownContent(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

export const getDisplayTextFromHistory = (
  parsedItem: Record<string, string>
): string => {
  const values = Object.values(parsedItem);
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "Empty input";
};

export const formatDisplayText = (text: string): string => {
  return text.length > 50 ? `${text.slice(0, 50)}...` : text;
};


export const isJWT = (token:string): boolean => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  try {
    const header = JSON.parse(atob(parts[0]));
    if (!header || !header.alg) {
      return false;
    }

    JSON.parse(atob(parts[1])); // Attempt payload decoding
  } catch {
    return false;
  }

  return true;
}