import { Component, OnInit } from '@angular/core';

import { SolrSearchService } from '../solr-search.service';
import { Observable } from 'rxjs/Observable';

import { FacetField, FacetFieldDetail } from '../facetfield';
import { FacetRange, FacetRangeDetail } from '../facetrange';
import { FilterQuery } from '../filterquery';
import { SortField, SORT_FIELDS } from '../sort';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  res: any;
  resSuggest: any;
  filterQueryStr: string = '';

  facetFieldMap: Map<string, string> = new Map();

  numResults: number;

  showFiltersBool: boolean = false;

  extractFacetsRequired: boolean = true;

  fqMap: Map<string, FilterQuery> = new Map();

  facetFields: FacetField[] = [];
  facetRanges: FacetRange[] = [];

  suggestions: string[] = [];

  pageNo: number = 1;
  totalPages: number;
  firstRec: number = 1;
  lastRec: number = 10;

  searchQuery: string;

  start: number = 0;

  sortFields = SORT_FIELDS;
  selectedSortField = this.sortFields[0];

  selectedFacets = [];

  constructor(private solrSearchService: SolrSearchService) { }

  onSortFieldChange(selectedSortField: SortField) {
    // console.log(this.selectedSortField);
    this.extractFacetsRequired = false;
    this.selectedSortField = selectedSortField;
    this.selectedSortField.isSelected = true;
    this.start = 0;
    this.pageNo = 1;
    this.sortFields.forEach((item, index) => {
      if (index !== this.selectedSortField.id) {
        item.isSelected = false;
      }
    }
    );
    this.getResponse();
  }

  hideFilters() {
    this.showFiltersBool = !this.showFiltersBool;
  }

  showNextPageResults() {
    this.extractFacetsRequired = false;
    let num = this.start;
    this.start = num + 10;
    let numPage = this.pageNo;
    this.pageNo = numPage + 1;
    this.firstRec = this.firstRec + 10;
    this.lastRec = this.lastRec + 10;
    if (this.numResults < this.lastRec) {
      this.lastRec = this.numResults;
    }

    this.getResponse();
  }

  showPreviousPageResults() {
    this.extractFacetsRequired = false;
    let num = this.start;
    this.start = num - 10;
    let numPage = this.pageNo;
    this.pageNo = numPage - 1;
    this.firstRec = this.firstRec - 10;
    this.lastRec = this.lastRec - 10;
    this.getResponse();
  }

  selectedSuggestTerm(str: string, e: any) {
    e.value = str;
    this.suggestions = [];
    this.searchQuery = str;
    this.facetFields = [];
    this.facetRanges = [];
    this.start = 0;
    this.pageNo = 1;
    this.getResponse();
  }

  onFacetSelection(mode: boolean, type: string, field: string, facetDetail: any) {
   // console.log(mode, type, field, facetDetail);
    this.generateFilterQueryMap(mode, field, type, facetDetail);
    this.extractFacetsRequired = true;
    this.facetFields = []
    this.facetRanges = [];
    this.start = 0;
    this.pageNo = 1;
    this.selectedFacets = []
    this.getResponse();
  }

  generateFilterQueryMap(mode: boolean, field: string, type: string, facetDetail: any) {
    let filterQuery = new FilterQuery(field, type, []);
   
    if (mode == true) {
      if (!this.fqMap.has(field))
        filterQuery.values.push(facetDetail.value);
      else {
        filterQuery = this.fqMap.get(field);
        filterQuery.values.push(facetDetail.value);
      }
      this.fqMap.set(field, filterQuery);
    }

    else {
      filterQuery = this.fqMap.get(field);
      filterQuery.values = filterQuery.values.filter(obj => obj !== facetDetail.value);
      if (filterQuery.values.length == 0) {
        this.fqMap.delete(field);
      }
      else { this.fqMap.set(field, filterQuery); }

    }
   // console.log(this.fqMap);
    this.generateFilterQueryString(this.fqMap);
  }

  generateFilterQueryString(fqMap: any) {
    // console.log(type);
    let fq: string[] = [];
    fqMap.forEach((value: FilterQuery, key: string) => {
      let valueStr = '';
      let rangeArr = [];
      if (value.type === 'RANGE') {
        valueStr = value.values.map(obj => `[${obj} TO ${obj + 100}]`).join(` OR `)
        valueStr = `${key}:${valueStr}`;
      }
      //console.log(key, value);
      else {
        valueStr = value.values.join(`" OR "`)
        valueStr = `${key}:"${valueStr}"`;
      }

      //console.log(valueStr)
      fq.push(valueStr)
    });
    //console.log(fq)
    this.filterQueryStr = fq.join('&fq=')
    this.filterQueryStr = `fq=${this.filterQueryStr}`
   // console.log(this.filterQueryStr)
  }

  onSearchButtonClick(query: string) {
    if (query.length > 0) {
      this.executeSearch(query);
    }
  }

  onBlurMethod() {
    // console.log("blur");
    this.suggestions = [];
  }

  getSuggestionsOrExecuteSearch(query: string, event: any) {
    //console.log(query, event);
    if (event.code == 'Enter') {
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
    this.facetRanges = [];
    this.extractFacetsRequired = true;
    this.suggestions = [];
    this.start = 0;
    this.pageNo = 1;
    this.getResponse();
  }

  getSuggestions(query: string) {
    if (query.length < 1) {
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
    this.solrSearchService.getResponse(this.searchQuery, this.selectedSortField, this.start, this.filterQueryStr)
      .subscribe(res => {
        this.res = res;
        console.log(this.res);
        this.totalPages = Math.ceil(this.res.response.numFound / 10);
        this.numResults = this.res.response.numFound;
        if (this.extractFacetsRequired) {
          this.extractFieldFacets(this.res.facet_counts.facet_fields);
          this.extractRangeFacets(this.res.facet_counts.facet_ranges);
        }
      });
  }

  extractSuggestions(res: any): string[] {
    let suggestions: string[] = []
    for (let key in res) {
      res[key].forEach((item, index) => {

        if (index % 2 == 0 && item.length >= 3) {
          suggestions.push(item);
        }
      }
      );
    }
    let suggestionsSet = Array.from(new Set(suggestions));
    return suggestionsSet

  }

  onClearAll() {
    this.facetFields = [];
    this.facetRanges = [];
    this.selectedFacets = [];
    this.extractFacetsRequired = true;
    this.fqMap.clear();
    this.filterQueryStr = '';
    this.showFiltersBool = false;
    this.getResponse();
  }

  extractRangeFacets(res: any) {
    // console.log(res);
    for (let key in res) {
      //console.log(key);
      //console.log(res[key])
      let facetDetails = this.getRangeFacetDetails(key, res[key].counts, res[key].gap);
      //console.log(facetDetails)
      let facetRange: FacetRange = new FacetRange(key, facetDetails);
      //console.log(facetField)
      this.facetRanges.push(facetRange)
    }
    // console.log(this.facetRanges)
  }

  getRangeFacetDetails(key: string, values: string[], gap: number): FacetRangeDetail[] {

    let value: number
    let count: number
    let checked: boolean = false
    let queryVal: string
    let facetRange: FacetRange
    let facetDetails: FacetRangeDetail[] = [];
    let facetDetail: FacetRangeDetail;
    values.forEach((item, index) => {

      if (index % 2 == 0) {
        // console.log("value: " + item);
        value = +item;
        queryVal = `[${value} TO ${value + gap}]`
        checked = this.setCheckedValue(key, +item);
        if (checked)
          this.selectedFacets.push({ field: key, type: "RANGE",value: value, queryVal: `${value}-${value + 100}` });
      }
      else {
        //console.log("count: " + item);
        count = +item;
        facetDetail = new FacetRangeDetail(value, count, checked, queryVal);
        facetDetails.push(facetDetail);
      }
    }
    );
    return facetDetails;
  }

  extractFieldFacets(res: any) {
    // console.log(res);
    for (let key in res) {
      //console.log(key);
      //console.log(res[key])
      let facetDetails = this.getFieldFacetDetails(key, res[key]);
      //console.log(facetDetails)
      let facetField: FacetField = new FacetField(key, facetDetails);
      //console.log(facetField)
      this.facetFields.push(facetField)
    }
    //console.log(this.facetFields)
  }

  getFieldFacetDetails(key: string, values: string[]): FacetFieldDetail[] {

    let value: string
    let count: number
    let checked: boolean = false;
    let facetField: FacetField
    let facetDetails: FacetFieldDetail[] = [];
    let facetDetail: FacetFieldDetail;
    values.forEach((item, index) => {

      if (index % 2 == 0) {
        // console.log("value: " + item);
        value = item;
        checked = this.setCheckedValue(key, value);
        if (checked)
        this.selectedFacets.push({ field: key, type: "RANGE",value: value, queryVal: value });
      }
      else {
        //console.log("count: " + item);
        count = +item;
        facetDetail = new FacetFieldDetail(value, count, checked);
        facetDetails.push(facetDetail);
      }
    }
    );
    return facetDetails;
  }

  setCheckedValue(key: string, value: any): boolean {
    // console.log("inside setCheckedValue");
    if (this.fqMap.has(key)) {
      return this.fqMap.get(key).values.includes(value)
    }
    return false;
  }

  getHighlightedFeatures(id: string): any[] {
   // console.log(this.res.highlighting[id].features)
      return this.res.highlighting[id].features
  }


  ngOnInit() {
    this.facetFieldMap.set('manu_exact', 'Manufacturer');
    this.facetFieldMap.set('cat', 'Category');
    this.facetFieldMap.set('genre_s', 'Genre');
    this.facetFieldMap.set('price', 'Price');
    this.getResponse();
  }
}
