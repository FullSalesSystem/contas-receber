export interface ColorPair {
  bg: string;
  tx: string;
}

export interface SearchFilter {
  key: string;
  label: string;
  type: string;
  opts?: string[];
  idx: number | null;
  val?: string;
  from?: string;
  to?: string;
}
