export interface BlogPost {
  id: string;
  title: string;
  date: string;
  tags: string[];
  content: any;  // eslint-disable-line @typescript-eslint/no-explicit-any
  snippet: string;
}