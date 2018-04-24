export class FacetField {
    field: string;
    type: string;
    facetFieldDetails: FacetFieldDetail[];

    constructor(field: string, facetFieldDetails: FacetFieldDetail[]){
      this.field = field;
      this.type = 'FACET';
      this.facetFieldDetails = facetFieldDetails;
    }
  }
  
  export class FacetFieldDetail {
    value: any;
    count: number;
    checked: boolean;

    constructor(value: any, count: number, checked: boolean){
      this.value = value;
      this.count = count;
      this.checked = checked;
    }

    setChecked(checked: boolean) {
      this.checked = checked;
    }
  }