import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { environment } from '../../../environments/environment';
import { Application } from '../../models/application';
declare const google: any;
declare const AppleID: any;

@Component({
  selector: 'app-login', 
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, AfterViewInit { 
  
  isSetUsername = false;
  isLoading = false;
  application:any = {}
  userData: any = { 
    handle: '' 
  };
  error:string = ''
  message:string = ''
  ENV = environment
  googleAuth2: any;
  @ViewChild('loginRef', {static: true }) loginElement!: ElementRef;


  constructor(private router: Router, private authService: AuthService) {
   
  } 



  async ngOnInit() { 
    if(this.authService.user  && this.authService.user.appUserId ) { 
      this.router.navigate(['profile']);
    } 
  }



  async ngAfterViewInit() {
    
    this.application = await this.authService.getApplication();
    if(this.application.error){
      this.error = this.application.error.message
      return;
    }
    if(this.application.googleLoginEnabled){ 
      
      google.accounts.id.initialize({
        client_id: this.ENV.GOOGLE_CLIENT_ID,
        callback: (response: any) => this.handleGoogleSignIn(response)
      });

      google.accounts.id.renderButton(document.getElementById("googleDiv"), {
        type: "standard",
        theme: "filled_blue",
        size: "large", 
        width:"200",
        text: "Sign in with Google",
        shape: "pill",
      });

    }
    

    if (this.application.appleLoginEnabled) {
      AppleID.auth.init({
        clientId : this.ENV.APPLE_BUNDLE_ID,
        scope : 'email name',
        redirectURI : this.ENV.APPLE_REDIRECT_URI,
        state : 'SignInUserAuthenticationRequest',
        usePopup : true
      });

      // must use Arrow Function to access 'this' object
      document.addEventListener('AppleIDSignInOnSuccess', (event:any) => {
        console.log("AppleIDSignInOnSuccess....event.detail .", event.detail); 

        let authorization = event.detail.authorization;

        let user = event.detail.user;
        
        if(user && user.name){
          user.firstName = user.name.firstName;
          user.lastName = user.name.lastName;
        }  
        
        this.handleSocialLogin(authorization.id_token, "apple", user);
      })
      
      document.addEventListener('AppleIDSignInOnFailure',(event:any) => {
        console.log("AppleIDSignInOnFailure.....", event.detail); 
        this.error = event.detail.error
      })

      
    }

  }


  handleGoogleSignIn(response: any) {
    console.log(response.credential);

    // This next is for decoding the idToken to an object if you want to see the details.
    let base64Url = response.credential.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let userPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    console.log("handleGoogleSignIn userPayload " , JSON.parse(userPayload));
    let user = JSON.parse(userPayload);
    user.lastName = user.family_name;
    user.firstName = user.given_name;
    this.handleSocialLogin(response.credential, "google", user)

  }




  async handleSocialLogin(token:String, provider:String, data:any ) { 
    this.error = ''
    this.isLoading = true;
    let result = await this.authService.socialLogin(token, provider);

    if(result.error && result.error.code == 603){

      if (provider == 'apple' && (!data || !data.firstName)) {
        this.error = `Whoop! Invalid Sign up. Please remove AppDemo in 'Sign with Apple' from your icloud setting and try again.`;
        this.isLoading = false;
        return
      }
      else {
        console.log("handleGoogleSignIn socialSignup data " , data);

        result = await this.authService.socialSignup(token, data.email, provider, `${data.firstName} ${data.lastName}`);
         
      }
    }

    this.isLoading = false;


    if(result.error) 
      this.error = result.error.message;
    else 
      this.router.navigate(['profile']);
    
   

  }

 

  updateFormData(event: any) {
    
    this.userData[event.target.name] = event.target.value
    //console.log({ userData: this.userData });
  }

  async loginAnonymousStart(){
    try { 
      this.message = ''
      this.error = ''

      this.isLoading = true;
      const authOptions:any = await this.authService.loginAnonymous();  

      if(authOptions.error) {
        this.error = authOptions.message; 
        this.isLoading = false;
        return;
      }
      let attestationResponse:any = await startRegistration({optionsJSON:authOptions}); 
      console.log("loginAnonymousStart this.attestationResponse = ", attestationResponse);
      attestationResponse.handle = authOptions.user.handle;

      const verification:any = await this.authService.loginAnonymousComplete(attestationResponse);
      
      this.isLoading = false;

      if (verification.jwt) {
        
        this.router.navigate(['profile']);
      } else {
        this.error = verification.error.message
      }
    } catch (err:any) {
      this.error = err.message
    }
    finally{
      this.isLoading = false;
    }

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
        this.error = authOptions.error.message; 
        this.isLoading = false;
        return;
      }
      else if (authOptions.requireAddPasskey){

        let attestationResponse:any = await startRegistration({optionsJSON:authOptions}); 
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
      }
      else {
        let assertionResponse = await startAuthentication({optionsJSON:authOptions});
        const loginResult:any = await this.authService.loginComplete(assertionResponse); 

        this.isLoading = false;

        if(loginResult.error)  this.error = authOptions.message;  
        else if(!loginResult.userName && this.application.userNamesEnabled) this.isSetUsername = true;
        else  this.router.navigate(['profile']); 
      }
    } catch (err:any) {
      this.error = err.message
    }
    finally{
      this.isLoading = false;
    }
  }


  async setUserNameHandler(){
    this.message = ''
    this.error = ''

    this.isLoading = true;

    const result:any = await this.authService.setUserName(this.userData);
    if(result.error) this.error = result.error.message
    else {
      this.router.navigate(['profile']);
    }

    this.isLoading = false;
  }
 
  
 


}
