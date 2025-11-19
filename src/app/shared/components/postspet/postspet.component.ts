import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { postpetView } from "src/app/models/postpet.model";

@Component({
    selector: "app-postspet",
    templateUrl: "./postspet.component.html",
    styleUrls: ["./postspet.component.scss"],
    standalone: false
})
export class PostspetComponent implements OnInit {
  constructor() {}

  @Output() loadMore = new EventEmitter();

  @Input() postspet: postpetView[] = [];
  @Input() isLoadingMore: boolean;
  @Input()
  set morePostspet(more: boolean) {
    if (!more) {
      document.getElementById("load-button").style.display = "none";
    } else {
      document.getElementById("load-button").style.display = "block";
    }
  }
  @Input() profilePosts: boolean = false;

  ngOnInit(): void {}

  onLoadMore() {
    this.loadMore.emit("");
  }
}
