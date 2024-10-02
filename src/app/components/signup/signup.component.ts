import { Component, OnInit } from '@angular/core';
import { startRegistration } from '@simplewebauthn/browser';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-signup',  
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})


export class SignupComponent implements OnInit{

  application:any = {}
  locales:Array<any>=[];
  isLoading = false;
  isConfirmSignup = false;
  isSetUsername = false;
  userData: any = { 
    handle: '',
    displayName: '',
    locale:'EN'
  };
  error:string = ''
  message:string = ''

  async ngOnInit() {
    this.application = await this.authService.getApplication()

    console.log("getApplication application = ", this.application)
    this.locales = this.authService.appLocales;
    
  }

  constructor(private router: Router, private authService: AuthService) {
   
  } 


   // function to update username
  updateFormData(event: any) {
    
    this.userData[event.target.name] = event.target.value
    //console.log({ userData: this.userData });
  }
 

  async signupStart() {

    console.log("signupStart this.userData ", this.userData);

    if (this.userData.handle == "" || this.userData.displayName == ""){
      this.error = "Please enter all field";
      return;
    }
    

    this.message = ''
    this.error = ''

    this.isLoading = true;

    const result:any = await this.authService.signup(this.userData);

     
    if(result.error){
      this.error = result.message;
      this.isLoading = false;
      return;
    }

    let attestationResponse:any = await startRegistration(result); 
    console.log("startRegistration this.attestationResponse = ", attestationResponse);
    attestationResponse.handle = this.userData.handle;

    const verification:any = await this.authService.signupConfirm(attestationResponse);


    if(verification.message) {
      this.message = verification.message;
      this.isConfirmSignup = true;
    }
    else this.error = result.error.message;

    this.isLoading = false;
    
  }

  async setUserNameHandler(){
    this.message = ''
    this.error = ''

    this.isLoading = true;

    const result:any = await this.authService.setUsername(this.userData);
    if(result.error) this.error = result.error.message
    else {
      this.router.navigate(['profile']);
    }

    this.isLoading = false;
  }

  // function to verify registration
  async verifySignup() {
    try {
      this.message = ''
      this.error = ''

      this.isLoading = true;

    
      const verification:any = await this.authService.signupComplete(this.userData);
      
      console.log("signupComplete verification = ", verification);

      this.isLoading = false;

      if (verification.jwt) {
        if(this.application.userNamesEnabled) this.isSetUsername = true;
        else  this.router.navigate(['profile']); 
        
      } else {
        this.error = verification.error.message
      }

    } catch (err) {
      console.error({ err });
      this.error = "invalid data"
    }
  }

  
 

}
