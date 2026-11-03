/** Page numbers with gaps, e.g. 1 … 4 5 6 … 12 */
export function pageList(page: number, total: number): (number | "gap")[] {
  const pages: (number | "gap")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages.at(-1) !== "gap") pages.push("gap");
  }
  return pages;
}
