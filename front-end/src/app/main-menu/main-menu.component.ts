import { Component, OnInit } from '@angular/core';
import {UserService} from '../_services/user.service';

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements OnInit {
  isGuest = true;
  isAdmin = false;

  constructor(private userSvc: UserService) { }

  ngOnInit(): void {
    this.isGuest = this.userSvc.userIsGuest();
    this.isAdmin = this.userSvc.userIsAdmin();
  }
  userIsGuest(): boolean {
    return this.isGuest;
  }
  userIsAdmin(): boolean {
    return this.isAdmin;
  }

}
