import { Component, OnInit } from '@angular/core';

import { SolrSearchService } from '../solr-search.service';
import { Observable } from 'rxjs/Observable';

import { FacetField, FacetFieldDetail } from '../facetfield';
import { FacetRange, FacetRangeDetail } from '../facetrange';
import { FilterQuery } from '../filterquery';
import { SortField, SORT_FIELDS } from '../sort';

import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  animations: [
    trigger('filtersState', [
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'translateX(-100%)'
        }),
        animate('200ms ease-in-out')
      ]),
      transition('* => void', [
        animate('300ms ease-in-out', style({
          opacity: 0,
          transform: 'translateX(-100%)'
        }))
      ])
    ]),
    trigger('sortState', [
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'translateX(100%)'
        }),
        animate('200ms ease-in-out')
      ]),
      transition('* => void', [
        animate('200ms ease-in-out', style({
          opacity: 0,
          transform: 'translateX(-100%)'
        }))
      ])
    ]),
    trigger('suggestionsState', [
      transition('void => *', [
        style({
          opacity: 0
        }),
        animate(200, style({ opacity: 1 }))
      ]),
      transition('* => void', [
        animate(200, style({ opacity: 0 }))
      ])
    ]),
    trigger('viewType', [
      transition('* => *', [
        style({
          opacity: 0
        }),
        animate('400ms ease-in-out')
      ])
    ])
  ]
})
export class SearchComponent implements OnInit {

  res: any;
  resSuggest: any;
  filterQueryStr: string = '';

  facetFieldMap: Map<string, string> = new Map();

  numResults: number;

  showFiltersBool: boolean = false;
  showSortDiv: boolean = false;
  filtersState = 'hide';
  suggestionsState = 'hide'
  sortState = 'hide'

  extractFacetsRequired: boolean = true;

  fqMap: Map<string, FilterQuery> = new Map();

  facetFields: FacetField[] = [];
  facetRanges: FacetRange[] = [];

  suggestions = [];

  pageNo: number = 1;
  totalPages: number;
  firstRec: number = 1;
  lastRec: number = 10;

  searchQuery: string;

  start: number = 0;

  viewType = 'card';

  sortFields = SORT_FIELDS;
  selectedSortField = this.sortFields[0];

  selectedFacets = [];

  showSpinner: boolean = false;

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
    //console.log(this.filtersState);
    this.showFiltersBool = false;
    this.filtersState = 'hide';
    //console.log(this.filtersState);
  }
  
  
  toggleFilters() {
    //console.log(this.filtersState);
    this.showFiltersBool = !this.showFiltersBool;
    this.filtersState = this.filtersState === 'show' ? 'hide' : 'show';
    //console.log(this.filtersState);
  }

  hideSort() {
    this.showSortDiv = false;
    this.sortState = 'hide';
  }

  toggleSortState() {
    //console.log(this.filtersState);
    this.showSortDiv = !this.showSortDiv;
    this.sortState = this.sortState === 'show' ? 'hide' : 'show';
    //console.log(this.filtersState);
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
    this.fqMap.clear();
    this.filterQueryStr = '';
    this.selectedFacets = [];
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
    let filterQuery = new FilterQuery(field, type, [], facetDetail);
   
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
       // console.log(value.fqDetail.queryVal);
        valueStr = value.fqDetail.queryVal
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
      this.fqMap.clear();
      this.filterQueryStr = '';
      this.selectedFacets = [];
      this.executeSearch(query);
    }
  }

  onBlurMethod() {
    // console.log("blur");
    this.suggestions = [];
  }

  toggleView(){
    this.viewType = this.viewType === 'card' ? 'detail' : 'card';
  }

  getSuggestionsOrExecuteSearch(query: string, event: any) {
    //console.log(query, event);
    if (event.code == 'Enter') {
      this.fqMap.clear();
      this.filterQueryStr = '';
      this.selectedFacets = [];
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
    this.selectedFacets = [];
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
        this.resSuggest = res;
        // console.log(this.resSuggest); 
        this.extractSuggestions(this.resSuggest);
        //console.log(this.suggestions);
      });
  }

  getResponse(): void {
    this.showSpinner = true;
    this.solrSearchService.getResponse(this.searchQuery, this.selectedSortField, this.start, this.filterQueryStr)
      .subscribe(res => {
        this.res = res;
       // console.log(this.res);
        this.totalPages = Math.ceil(this.res.response.numFound / 10);
        this.numResults = this.res.response.numFound;
        if (this.extractFacetsRequired) {
          this.extractFieldFacets(this.res.facet_counts.facet_fields);
          this.extractRangeFacets(this.res.facet_counts.facet_ranges);
        }
        this.showSpinner = false;
      });
  }

  extractSuggestions(res: any) {
    this.suggestions = [];
    //console.log(res)
    res.response.docs.forEach(element => {
     // console.log(res.highlighting[element.id].name_tn[0]);
      this.suggestions.push({dispVal: res.highlighting[element.id].name_tn[0], queryVal: element.name_s});
    });

    if(res.spellcheck && res.spellcheck.collations && res.spellcheck.collations.length > 0)
      this.suggestions.push({dispVal: res.spellcheck.collations[1].collationQuery, queryVal: res.spellcheck.collations[1].collationQuery});
    // console.log(this.suggestionsState);

      if(this.suggestions.length > 0) 
          this.suggestionsState = 'show';
      else
      this.suggestionsState = 'hide';

     // console.log(this.suggestionsState);
  }

  onClearAll() {
    this.facetFields = [];
    this.facetRanges = [];
    this.selectedFacets = [];
    this.extractFacetsRequired = true;
    this.fqMap.clear();
    this.filterQueryStr = '';
    this.showFiltersBool = false;
    this.filtersState = 'hide';
    this.getResponse();
  }

  extractRangeFacets(res: any) {
    // console.log(res);
    for (let key in res) {
      //console.log(key);
      //console.log(res[key])
      let facetDetails = this.getRangeFacetDetails(key, res[key]);
      //console.log(facetDetails)
      let facetRange: FacetRange = new FacetRange(key, facetDetails);
      //console.log(facetField)
      this.facetRanges.push(facetRange)
    }
    // console.log(this.facetRanges)
  }

  getRangeFacetDetails(key: string, res: any): FacetRangeDetail[] {

    let value: number
    let count: number
    let checked: boolean = false
    let queryVal: string
    let facetRange: FacetRange
    let facetDetails: FacetRangeDetail[] = [];
    let facetDetail: FacetRangeDetail;

    checked = this.setCheckedValue(key, 'before');
    if (checked)
      this.selectedFacets.push({ field: key, type: "RANGE",value: 'before', dispVal: `Under ${res.start}` });
    facetDetail = new FacetRangeDetail('before', res.before, checked, `[* TO ${res.start}]`, `Under ${res.start}`);
    facetDetails.push(facetDetail);

    res.counts.forEach((item, index) => {

      if (index % 2 == 0) {
        // console.log("value: " + item);
        value = +item;
        queryVal = `[${value} TO ${value + res.gap}]`
        checked = this.setCheckedValue(key, +item);
        if (checked)
          this.selectedFacets.push({ field: key, type: "RANGE",value: value, dispVal: `${value}-${value + res.gap}` });
      }
      else {
        //console.log("count: " + item);
        count = +item;
        facetDetail = new FacetRangeDetail(value, count, checked, queryVal, `${value} - ${value + res.gap}`);
        facetDetails.push(facetDetail);
      }
    }
    );

    checked = this.setCheckedValue(key, 'after');
    if (checked)
      this.selectedFacets.push({ field: key, type: "RANGE",value: 'after', dispVal: `Over ${res.end}` });
    facetDetail = new FacetRangeDetail('after', res.after, checked, `[${res.end} TO *]`, `Over ${res.end}`);
    facetDetails.push(facetDetail);

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
        this.selectedFacets.push({ field: key, type: "FACET",value: value, dispVal: value });
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
    //console.log("inside setCheckedValue");
   // console.log(this.fqMap.has(key))
    if (this.fqMap.has(key)) {
     // console.log(this.fqMap.get(key).values)
    //  console.log(value)
     // console.log(this.fqMap.get(key).values.includes(value))
      return this.fqMap.get(key).values.includes(value)
    }
    return false;
  }

  getHighlightedFeatures(id: string): any[] {
   // console.log(this.res.highlighting[id].features)
      return this.res.highlighting[id].features
  }

  purchase(url: string) {
    window.open(url,'_blank');
  }

  onFilterfocusOut() {
    console.log("focus out");
  }


  ngOnInit() {
    this.facetFieldMap.set('brand_s', 'Brand');
    this.facetFieldMap.set('os_s', 'Operating System');
    this.facetFieldMap.set('price_f', 'Price');
    this.getResponse();
  }
}
