import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

@Component({
  selector: 'app-login', 
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit { 
  
  isSetUsername = false;
  isLoading = false;
  application:any = {};
  userData: any = { 
    handle: '' 
  };
  error:string = ''
  message:string = ''

  constructor(private router: Router, private authService: AuthService) {
   
  } 

  async ngOnInit() {
    this.application = await this.authService.getApplication();

    if(this.authService.user  && this.authService.user.appUserId ) { 
      this.router.navigate(['profile']);
    }

  }

  updateFormData(event: any) {
    
    this.userData[event.target.name] = event.target.value
    //console.log({ userData: this.userData });
  }

  async loginAnonymousStart(){
    this.message = ''
    this.error = ''

    this.isLoading = true;
    const authOptions:any = await this.authService.loginAnonymous();  

    if(authOptions.error) {
      this.error = authOptions.message; 
      this.isLoading = false;
      return;
    }
    let attestationResponse:any = await startRegistration(authOptions); 
    console.log("loginAnonymousStart this.attestationResponse = ", attestationResponse);
    attestationResponse.handle = authOptions.user.handle;

    const verification:any = await this.authService.loginAnonymousComplete(attestationResponse);
    
    this.isLoading = false;

    if (verification.jwt) {
      
      this.router.navigate(['profile']);
    } else {
      this.error = verification.error.message
    }
    return;

  }


  async loginStart() {
    try {
      
      if (this.userData.handle == ""){
        this.error = "Please enter user handle";
        return;
      }
      console.log("loginStart this.userData ", this.userData);

      this.message = ''
      this.error = ''

      this.isLoading = true;

      const authOptions:any = await this.authService.login(this.userData);  

      if(authOptions.error) {
        this.error = authOptions.message; 
        this.isLoading = false;
        return;
      }
      else if (authOptions.requireAddPasskey){

        let attestationResponse:any = await startRegistration(authOptions); 
        console.log("startRegistration this.attestationResponse = ", attestationResponse);
        attestationResponse.handle = authOptions.user.handle;

        const verification:any = await this.authService.signupComplete(attestationResponse);
        
        this.isLoading = false;

        if (verification.jwt) {
          
          if(!verification.userName && this.application.userNamesEnabled) this.isSetUsername = true;
          else  this.router.navigate(['profile']); 
          
        } else {
          this.error = verification.error.message
        }
        return;
      }

      let assertionResponse = await startAuthentication(authOptions);
      const loginResult:any = await this.authService.loginComplete(assertionResponse); 

      this.isLoading = false;

      if(loginResult.error)  this.error = authOptions.message;  
      else if(!loginResult.userName && this.application.userNamesEnabled) this.isSetUsername = true;
      else  this.router.navigate(['profile']); 
    
    } catch (error) {
        
    }
   
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



}
