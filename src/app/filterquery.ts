export class FilterQuery {
    field: string;
    type: string;
    values: any[];

    constructor(field: string, type: string, values: any[] ){
      this.field = field;
      this.type = type;
      this.values = values;
    }
  }
  
  