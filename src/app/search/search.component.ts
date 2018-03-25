import { Component, OnInit } from '@angular/core';

import { SolrSearchService } from '../solr-search.service';
import { Observable } from 'rxjs/Observable';
import { FacetField, FacetDetail } from '../facetfield';
import { SORT_FIELDS} from '../sort';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  res: any;
  resSuggest: any;
  filterQuery: string = '';

  extractFacetsRequired: boolean = true;

  fqMap: Map<string, any[]> = new Map();

  facetFields: FacetField[] = [];

  suggestions: string[] = [];

  pageNo: number = 1;
  totalPages: number;

  searchQuery: string = "*:*";

  start: number = 0;

  sortFields = SORT_FIELDS;
  selectedSortField = this.sortFields[0];
 
  constructor(private solrSearchService: SolrSearchService) { }

  onSortFieldChange() {
   // console.log(this.selectedSortField);
    this.extractFacetsRequired = false;
    this.getResponse();
  }

  showNextPageResults(){
    this.extractFacetsRequired = false;
    let num = this.start;
    this.start = num + 10;
    let numPage = this.pageNo;
    this.pageNo = numPage + 1;
    this.getResponse();
  }

  showPreviousPageResults() {
    this.extractFacetsRequired = false;
    let num = this.start;
    this.start = num - 10;
    let numPage = this.pageNo;
    this.pageNo = numPage - 1;
    this.getResponse();
  }

  selectedSuggestTerm(str: string, e: any) {
    e.value=str;
    this.suggestions = [];
    this.searchQuery = str;
    this.facetFields = [];
    this.getResponse();
  }

  onFacetSelection(mode: boolean, field: string, value: string, event: any){
    //console.log(mode, field, value);
    this.generateFilterQueryMap(mode,field,value);
    this.extractFacetsRequired = true;
    this.facetFields = []
    this.getResponse();
    event.target.checked = mode;
    console.log(event.target.checked);
  }

  generateFilterQueryMap(mode: boolean, field: string, value: string) {
    let valueArr = [];
    if (mode == true) {
    if(!this.fqMap.has(field)) {
      valueArr.push(value);
    }
    else{
      valueArr = this.fqMap.get(field);
      valueArr.push(value);
    }
    this.fqMap.set(field,valueArr);
  }

  else{
    valueArr = this.fqMap.get(field);
    valueArr = valueArr.filter(obj => obj !== value);
    if(valueArr.length == 0) {
        this.fqMap.delete(field);
    }
    else { this.fqMap.set(field,valueArr);}
  
  }
    //console.log(this.fqMap);
    this.generateFilterQueryString(this.fqMap);
  }

  generateFilterQueryString(fqMap: any) {
    let fq: string[] = [];
    fqMap.forEach((value: string[], key: string) => {
      //console.log(key, value);
      let valueStr = value.join(`" OR "`)
      valueStr = `${key}:"${valueStr}"`;
      //console.log(valueStr)
      fq.push(valueStr)
  });
  //console.log(fq)
  this.filterQuery = fq.join('&fq=')
  this.filterQuery = `fq=${this.filterQuery}`
  console.log(this.filterQuery)
  }


getSuggestionsOrExecuteSearch(query: string, event: any) {
//console.log(query, event);
if(event.code == 'Enter'){
  this.executeSearch(query);
  event.target.blur();
}
else {
  this.getSuggestions(query);
}
}

  executeSearch(query: string) {
    this.searchQuery = query;
    this.facetFields = [];
    this.suggestions = [];
    this.getResponse();
  }

  getSuggestions(query: string) {
    if(query.length < 1) {
      this.suggestions = [];
      return;
    }
    this.solrSearchService.getAutoCompleteSuggestions(query)
    .subscribe(res => {
      this.resSuggest = res.terms;
     // console.log(this.resSuggest); 
      this.suggestions = this.extractSuggestions(this.resSuggest);
      //console.log(this.suggestions);
    });
  }

  getResponse(): void {
    this.solrSearchService.getResponse(this.searchQuery, this.selectedSortField, this.start, this.filterQuery)
        .subscribe(res => {
          this.res = res;
          console.log(this.res);
          this.totalPages = Math.ceil(this.res.response.numFound/10); 
          if(this.extractFacetsRequired)   
          this.extractFacets(this.res.facet_counts.facet_fields);
        });
  }

  extractSuggestions(res: any) : string[] {
    let suggestions: string[] = []
  for(let key in res) {
    res[key].forEach((item, index) => {
    
      if(index%2 == 0) {
        suggestions.push(item);
      }
  }
  );
}
let suggestionsSet = Array.from(new Set(suggestions));
return suggestionsSet

  }

  extractFacets(res: any) {
  // console.log(res);
    for(let key in res) {
      //console.log(key);
      //console.log(res[key])
      let facetDetails = this.getFacetDetails(key, res[key]);
      //console.log(facetDetails)
      let facetField: FacetField = new FacetField(key, facetDetails);
      //console.log(facetField)
      this.facetFields.push(facetField)
    }
   // console.log(this.facetFields)
  }

  getFacetDetails(key:string, values: string[]) : FacetDetail[] {

  let value: string
   let count: number
   let checked: boolean = false;
   let facetField : FacetField
   let facetDetails : FacetDetail[] = [];
   let facetDetail: FacetDetail;
    values.forEach((item, index) => {
    
      if(index%2 == 0) {
       // console.log("value: " + item);
        value = item;
        checked = this.setCheckedValue(key, value);
      }
      else {
       //console.log("count: " + item);
        count = +item;
        facetDetail = new FacetDetail(value, count, checked);
        facetDetails.push(facetDetail);
      }
  }
  );
    return facetDetails;
  }

  setCheckedValue(key: string, value: string) : boolean{
     // console.log("inside setCheckedValue");
      if(this.fqMap.has(key)) {
         // console.log(key, "key in fq");
         // console.log(this.fqMap.get(key).includes(value))
          return this.fqMap.get(key).includes(value)
      }
      return false;
  }
  

  ngOnInit() {
    this.getResponse();
  }

}
