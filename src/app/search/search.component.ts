import { Component, OnInit,
  ElementRef,Input ,Output,EventEmitter} from '@angular/core';
import {UtilityService} from '../services/common/utility.service'
declare const $: any;

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})

export class SearchComponent implements OnInit {

  constructor(
    public util: UtilityService ,
    private inputControlRef: ElementRef<HTMLInputElement> ,
    private suggestionBoxDropdown:ElementRef<HTMLInputElement>,
    private searchContainerRef:ElementRef<HTMLInputElement>   ) { }
    public searchTerm:string
    public searchTags:Array<any>
    public tag:any

    @Input() criteriaList = [
      this.util.SearchCriteria('name', 'Campaign Name Contains', 'campaignName',''),
      this.util.SearchCriteria('id', 'Campaign Id Equals', 'campaignId',''),
   ];
   @Input() selectedCriteria = this.util.SearchCriteria('name', 'Campaign Name Contains', 'campaignName',''); 
   @Output() onSearchUpdate: EventEmitter<any> = new EventEmitter<any>();

  ngOnInit(): void {
    this.searchTags = []
    if(typeof this.selectedCriteria === 'undefined') {
      this.selectedCriteria =  this.util.SearchCriteria('name', 'Campaign Name Contains', 'campaignName','');
   }
   }
   setSearchField(selectedCriteria, inputControlRef) {
   this.selectedCriteria = selectedCriteria;
   }

  addSearchTag(selectedCriteria, inputControlRef) {
         

    this.setSearchField(selectedCriteria, inputControlRef);
    if(this.searchTerm!==undefined) {
        this.addTags(inputControlRef);
    }
  }

  clearSearch(inputControlRef,suggestionBoxDropdown) {
    this.searchTags = [];
    this.hideSuggestionBoxIfVisible(inputControlRef,suggestionBoxDropdown);
    this.notifySearchUpdate(this.searchTags);
  } 

  notifySearchUpdate(search) {
  console.log("notifySearchUpdate",search)
  this.onSearchUpdate.emit(search);
  }

  inputSearch(searchContainerRef, inputControlRef, suggestionBoxDropdown) {
  var _this = this;
  window.addEventListener('click', function (e) {
      if(!searchContainerRef.children[0].contains(e.target)) {
          $(suggestionBoxDropdown).removeClass('d-block').addClass('d-none');
          inputControlRef.classList.add('shadow-none');
          inputControlRef.value= '';
          _this.searchTerm='';
          searchContainerRef.removeEventListener('click', this);
      }
  });
  inputControlRef.classList.remove('shadow-none');
  inputControlRef.focus();
  this.showSuggestionDropdown(suggestionBoxDropdown);
  }

  removeSearchTag(tag, inputControlRef) {
  this.searchTags = this.util.removeCriteria(this.searchTags, tag);
  this.notifySearchUpdate(this.searchTags);
  }

  addTags(inputControlRef) {
    if(inputControlRef.value.trim()!=='') {
        var criteriaToAdd = this.util.copyCriteria(this.selectedCriteria).setValue(this.searchTerm);
        this.util.addCriteria(this.searchTags, criteriaToAdd,()=>{});
        this.notifySearchUpdate(this.searchTags)
        inputControlRef.value = '';
        this.searchTerm='';
    }
    this.resetTagSelection(inputControlRef);
  }


  resetTagSelection(inputControlRef) {
    $(inputControlRef).closest('.form-inline').find('div.rounded-pill').each(function () {
        $(this).removeClass('bg-cms-primary').addClass('bg-cms-dark');
    });
  }
  onSearchInput($event, inputControlRef,suggestionBoxDropdown) {
    this.showSuggestionDropdown(suggestionBoxDropdown);
    inputControlRef.classList.remove('shadow-none');
    if($event.keyCode===13) {// enter
        this.addTags(inputControlRef);
    }else if($event.keyCode===8){// backspace
        if(inputControlRef.value.trim() === '' && this.searchTags.length>0) {
            var tagElem = $(inputControlRef).closest('.form-inline').find('rounded-pill').eq(this.searchTags.length - 1);
            this.deleteSelectedTag(tagElem, inputControlRef);
        }
    }else if($event.keyCode===37) {//left arrow

    }else if($event.keyCode===38) {//up arrow
      this.navigateAndSelectUsingArrowKeys(inputControlRef, -1);
    }else if($event.keyCode===39) {//right arrow

    }else if($event.keyCode===40) {//down arrow
        this.navigateAndSelectUsingArrowKeys(inputControlRef, 1);
    }else if($event.keyCode===27) {//escape key
      this.hideSuggestionBoxIfVisible(inputControlRef,suggestionBoxDropdown);
    }
    }

  hideSuggestionBoxIfVisible(inputControlRef,suggestionBoxDropdown) {
    if($(suggestionBoxDropdown).is(':visible')) {
        inputControlRef.value='';
        this.searchTerm = '';
        this.hideSuggestionDropdown(suggestionBoxDropdown)
        inputControlRef.classList.add('shadow-none');
        inputControlRef.blur();
    }
  }
  navigateAndSelectUsingArrowKeys(inputControlRef, direction) {
  var suggestionBoxDropdown = inputControlRef.siblings('.suggestionBoxDropdown');
  if(suggestionBoxDropdown.is(':visible')) {
      var dropdownItems = suggestionBoxDropdown.find('.dropdown-item');
      var activeIndex = -1;
      dropdownItems.each(function (index, dropdownItem) {
          if($(dropdownItem).hasClass('active')) {
              activeIndex = index;
              return false;
          }
      });
      var size = dropdownItems.size();
      if(size > 0) {
          var newIndex = activeIndex + direction;
          if(newIndex < 0 || newIndex >= size) {
              newIndex = (direction < 0) ? size - 1: 0;
          }
          var selectedCriteria = dropdownItems.eq(newIndex).data('tagValue');
          this.setSearchField(selectedCriteria, inputControlRef);
      }
  }
  }

  onSearchFocus(suggestionBoxDropdown):void {
  this.showSuggestionDropdown(suggestionBoxDropdown)
  }

  showSuggestionDropdown(suggestionBoxDropdown){
  suggestionBoxDropdown.classList.add('d-block');
  suggestionBoxDropdown.classList.remove('d-none');
  }


  hideSuggestionDropdown(suggestionBoxDropdown){
    suggestionBoxDropdown.classList.add('d-none');
    suggestionBoxDropdown.classList.remove('d-block');
  }

  onSuggestionItemHover($event, suggestionBoxDropdown) {
    suggestionBoxDropdown.find('div.suggestionBoxItem').removeClass('bg-light').addClass('bg-white');
    $($event.target).removeClass('bg-white').addClass('bg-light');
  }

  deleteSelectedTag(tagElem, inputControlRef) {
    if(tagElem.hasClass('bg-cms-primary')) {
        var tag = tagElem.data('tagValue');
        this.removeSearchTag(tag, inputControlRef);
    }else{
        tagElem.removeClass('bg-cms-dark').addClass('bg-cms-primary') 
    }
  }

}

