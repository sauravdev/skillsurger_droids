import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractJsonFromMarkdown(content: string): string {
  // Remove markdown code block delimiters
  const cleanedContent = content
    .replace(/^```json\s*/i, '') // Remove opening ```json
    .replace(/^```\s*/i, '') // Remove opening ```
    .replace(/\s*```$/i, '') // Remove closing ```
    .trim();
  
  return cleanedContent;
}