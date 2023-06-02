import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {

  constructor() { }

  getPaginationData(totalItems: number, currentPage: number = 1, limit: number = 10, maxPage: number = 5) {
    // calculate total pages
    const totalPages = Math.ceil(totalItems / limit);

    // ensure current page isn't out of range
    if (currentPage < 1) {
      currentPage = 1;
    } else if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    let startPage: number;
    let endPage: number;
    if (totalPages <= maxPage) {
      // less than maxPage total pages so show all
      startPage = 1;
      endPage = totalPages;
    } else {
      const upperRange = Math.ceil((maxPage * 0.60));
      const lowerRage = maxPage - upperRange;
      // more than maxPage total pages so calculate start and end pages
      if (currentPage <= upperRange) {
        startPage = 1;
        endPage = maxPage;
      } else if (currentPage + lowerRage >= totalPages) {
        startPage = totalPages - (maxPage - 1);
        endPage = totalPages;
      } else {
        startPage = currentPage - (upperRange - 1);
        endPage = currentPage + lowerRage;
      }
    }

    // calculate start and end item indexes
    const start = (currentPage - 1) * limit;

    // create an array of pages to ng-repeat in the pager control
    const pages = Array.from(Array((endPage + 1) - startPage).keys()).map(i => startPage + i);

    // return object with all pager properties required by the view
    return {
      start,
      pages,
      currentPage,
      totalPages,
    };
  }
}
