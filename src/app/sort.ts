export class SortField {
id: number;
value: string;
sortQuery: string;
isSelected: boolean;
}

export const SORT_FIELDS: SortField[] = [
    { id: 0, value: 'Relevance', sortQuery: 'score desc', isSelected: true },
    { id: 1, value: 'Price: Low to High', sortQuery: 'price asc', isSelected: false },
    { id: 2, value: 'Price: High to Low', sortQuery: 'price desc', isSelected: false }
  ];