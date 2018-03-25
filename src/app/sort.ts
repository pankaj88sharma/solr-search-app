class SortField {
id: number;
value: string;
sortQuery:string;
}

export const SORT_FIELDS: SortField[] = [
    { id: 0, value: 'Relevance', sortQuery: 'score desc' },
    { id: 1, value: 'Price: Low to High', sortQuery: 'price asc' },
    { id: 2, value: 'Price: High to Low', sortQuery: 'price desc' }
  ];