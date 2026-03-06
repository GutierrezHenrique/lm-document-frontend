export interface RagIndexResult {
  fileId: string;
  chunks: number;
}

export interface RagQueryResult {
  answer: string;
  snippets: string[];
}
