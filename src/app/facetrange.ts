export class FacetRange {
    field: string;
    type: string;
    facetRangeDetails: FacetRangeDetail[];

    constructor(field: string, facetRangeDetails: FacetRangeDetail[]){
      this.field = field;
      this.type = 'RANGE'
      this.facetRangeDetails = facetRangeDetails;
    }
  }
  
  export class FacetRangeDetail { 
    value: any;
    count: number;
    checked: boolean;
    queryVal: string;
    dispVal: string;


    constructor(value: any, count: number, checked: boolean, queryVal: string, dispVal: string){ 
      this.value = value;
      this.count = count;
      this.checked = checked;
      this.queryVal = queryVal;
      this.dispVal = dispVal;
    }
  }