import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';



@Injectable()
export class SolrSearchService {

  private solrUrl = 'http://ec2-18-216-15-131.us-east-2.compute.amazonaws.com:8983/solr/techproducts/select?&facet.field=cat&facet=on&facet.limit=10&facet.field=genre_s&facet.mincount=1';  // URL to solr api

  private solrSuggestUrl = 'http://ec2-18-216-15-131.us-east-2.compute.amazonaws.com:8983/solr/techproducts/terms?terms.fl=name&terms.fl=genre_s&terms.fl=title&terms.fl=cat&&terms.prefix=';  // URL to solr api
  constructor(private http: HttpClient) { }

  
  
getResponse (query: string, sortField: any, start: number, fq: string): Observable<any> {
  /* const headers = new HttpHeaders().append('Access-Control-Allow-Headers', 'Content-Type')
  .append('Access-Control-Allow-Methods', 'GET')
  .append('Access-Control-Allow-Origin', '*');  */
  let url = `${this.solrUrl}&q=${query}`;
  if(sortField.id != 0) { 
    url = `${url}&sort=${sortField.sortQuery}`;
  }

  if(start > 0) {
    url = `${url}&start=${start}`;
  }
  url = `${url}&${fq}`;
  console.log(url);
  return this.http.get<any>(url)
    .pipe(
      tap(heroes => console.log('fetched results from solr')),
      catchError(this.handleError('getSearchResults', {}))
    );
}


getAutoCompleteSuggestions (term: string): Observable<any> {
  let url = `${this.solrSuggestUrl}${term}`;
  return this.http.get<any>(url)
    .pipe(
      tap(heroes => console.log('fetched suggestions from solr')),
      catchError(this.handleError('getAutoCompleteSuggestions', {}))
    );
}

  /**
 * Handle Http operation that failed.
 * Let the app continue.
 * @param operation - name of the operation that failed
 * @param result - optional value to return as the observable result
 */
private handleError<T> (operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {

    // TODO: send the error to remote logging infrastructure
    console.error(error); // log to console instead

    // TODO: better job of transforming error for user consumption
    console.log(`${operation} failed: ${error.message}`);

    // Let the app keep running by returning an empty result.
    return of(result as T);
  };
}

}
