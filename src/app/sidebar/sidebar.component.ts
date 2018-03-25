import { Component, OnInit } from '@angular/core';

import { SolrSearchService } from '../solr-search.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  constructor(private solrSearchService: SolrSearchService) { }

  ngOnInit() {
  }

}
