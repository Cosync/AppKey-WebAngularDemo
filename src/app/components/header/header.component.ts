import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
 
@Component({
  selector: 'app-header', 
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})

export class HeaderComponent {

  currentUser: any = {};

  constructor(private authService: AuthService) {

    this.currentUser = this.authService.user;

    this.authService.user$.subscribe(user => { 
      this.currentUser = user; 
      
    });
    
    
  }
}
