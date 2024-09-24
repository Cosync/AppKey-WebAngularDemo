import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { User } from './models/user';
import { AuthService } from './auth.service';
 
  
@Component({
  selector: 'app-root', 
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'PassClef-WebAngularDemo';

 

  constructor(private authService: AuthService, private router: Router) {
    // router.events.subscribe((val) => {
    //   this.user = this.authService.user;
    // });
  }
  
  async ngOnInit(): Promise<void> {
    // get user data when component loads
    
  }

}
