export class FilterQuery {
    field: string;
    type: string;
    values: any[];
    fqDetail: any;

    constructor(field: string, type: string, values: any[], fqDetail: any ){
      this.field = field;
      this.type = type;
      this.values = values;
      this.fqDetail = fqDetail;
    }
  }
  
  