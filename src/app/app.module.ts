import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SearchComponent } from './search/search.component';

import { HttpClientModule } from '@angular/common/http';

import { SolrSearchService } from './solr-search.service'


@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    SearchComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [SolrSearchService, HttpClientModule],
  bootstrap: [AppComponent]
})
export class AppModule { }
