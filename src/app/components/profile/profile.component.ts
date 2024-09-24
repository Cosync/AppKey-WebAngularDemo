import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile', 
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit{

  formData:any = {};
  currentUser: any = {};
  application:any = {};

  constructor(private authService: AuthService, private router: Router) { 
    this.currentUser = authService.user;
    if(this.currentUser) {
      this.formData = this.currentUser; 
    }
   
    
    this.authService.user$.subscribe(user => { 
      this.currentUser = user; 
    }); 
    
  }

  async ngOnInit() {

    if(!this.authService.user || !this.authService.user.appUserId ) { 
      this.router.navigate(['login']);
    }
    this.application = await this.authService.getApplication();

    console.log("ngOnInit ", this.application)

    this.currentUser = this.authService.user
  }


  updateFormData(event: any) {
    
    this.formData[event.target.name] = event.target.value
    //console.log({ userData: this.userData });
  }

  async updateProfile(){
    let resutl = await this.authService.updateProfile(this.formData)

    if(resutl.error) alert(resutl.error.message)
    else {
      alert("Success")
    }
  }
}
