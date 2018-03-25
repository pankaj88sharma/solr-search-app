export class FacetField {
    field: string;
    facetDetails: FacetDetail[];

    constructor(field: string, facetDetails: FacetDetail[]){
      this.field = field;
      this.facetDetails = facetDetails;
    }
  }
  
  export class FacetDetail {
    value: string;
    count: number;
    checked: boolean;

    constructor(value: string, count: number, checked: boolean){
      this.value = value;
      this.count = count;
      this.checked = checked;
    }

    setChecked(checked: boolean) {
      this.checked = checked;
    }
  }