/** Map word indices of `a` to indices of `b` along a longest common subsequence of the words. */
export function alignWords(a: string[], b: string[]): Map<number, number> {
  const lcs = a.map(() => new Array<number>(b.length + 1).fill(0));
  lcs.push(new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const map = new Map<number, number>();
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) map.set(i++, j++);
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) i++;
    else j++;
  }
  return map;
}
