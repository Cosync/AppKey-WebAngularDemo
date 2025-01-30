import { Injectable } from '@angular/core';
import { User } from './models/user';
import { environment } from '../environments/environment';
import { BehaviorSubject } from 'rxjs';  
import { Application } from './models/application';
import { NgxAppkeyWebauthnService} from 'ngx-appkey-webauthn'

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  public localeList:Array<any> = [];
  public appLocales:Array<any> = [];
  public user$: BehaviorSubject<User>;
  public user:User = new User() 
  public application:Application = new Application()
  private signupToken:String = ""
 
 

  constructor(private authService: NgxAppkeyWebauthnService) { 

    this.user$ = new BehaviorSubject<User>(this.user);

    let cache = localStorage.getItem('currentUser');  
    if (cache != "undefined" && cache != null)
    {
      try { 

       
        let user = JSON.parse(cache) as User; 
        this.user = user; 

        console.log("Auth Service cache user ", user)

        this.user$.next(user);
      } catch (error) { 
       
      }
    }


    let config = {
      apiUrl : environment.REST_API,
      appToken: environment.APP_TOKEN
    }

    this.authService.configure(config) 

    this.localeList = this.authService.localeList;
  }

  async isLoggedin(): Promise<boolean> {
    try {
      return false;
    } catch (error) {
      console.log({ error });
      return false;
    }
  }
 
 

  logout(){
    localStorage.clear(); 
    this.user = new User() 
    this.authService.logout();
    this.signupToken = "";
    this.user$.next(this.user);
   
  }

 
  async getApplication(): Promise<any> {
    let app =  await this.authService.getApp();
   
    if(app.message){ 
      return this.responseResult(app);
    }

    this.application = app as Application
    
    

    this.appLocales = [];
    for (let index = 0; index < this.application.locales.length; index++) {
      const applocale = this.application.locales[index];

      if(applocale){
        let locale = this.localeList.filter(item => item.code == applocale)[0]
        if(locale) this.appLocales.push(locale)
      }

    }

    return this.application;
  }



  async updateProfile(data:any): Promise<any> {
    try {
      let result = await this.authService.updateProfile(data); 
      return this.responseResult(result);
    } catch (error) {
      return {error:error}
    }
   
  }


  async login(data: any): Promise<any> {
    try {
      let result = await this.authService.login(data); 
      return this.responseResult(result);
    } catch (error) {
      return {error:error}
    }
    
  }


  async loginComplete(data: any): Promise<any> {
    try { 
      let result:any = await this.authService.loginComplete(data.handle, data); 

      if(!result.message) { 
      
        this.user$.next(result);
        this.user = result
        this.user.accessToken = result['access-token'] 
        localStorage.setItem('currentUser', JSON.stringify(this.user));

      } 
      return this.responseResult(result);
    } catch (error) {
        return {error:error}
    }
  }


  async loginAnonymous(): Promise<any> {
    try {
      let data = {handle:`ANON_${crypto.randomUUID()}`}
      let result =  await this.authService.loginAnonymous(data); 
      return this.responseResult(result);
    } catch (error) {
      return {error:error}
    }
    
  }


  async loginAnonymousComplete(data:any): Promise<any> { 
    try { 
        
      let result:any = await this.authService.loginAnonymousComplete(data.handle, data);
      if(!result.message){ 
    
        this.user = result as User
        this.user.accessToken = result['access-token']
        this.user$.next(this.user); 
        
        localStorage.setItem('currentUser', JSON.stringify(this.user));
      }

      return this.responseResult(result);
    } catch (error) {
      return {error:error}
    }
  }


  async signup(data: any): Promise<any> {
    this.signupToken = "";
      try {
        let result =  await this.authService.signup( data);
        return this.responseResult(result);
      } catch (error) {
        return {error:error}
      }
    
   
  }


  async signupConfirm(data: any): Promise<any> {
    try {
      let result:any = await this.authService.signupConfirm(data.handle, data);
      if(result && result['signup-token'])  this.signupToken = result['signup-token']; 
      return this.responseResult(result);
    } catch (error) {
      return {error:error}
    }
  }


  async signupComplete(data: any): Promise<any> { 
      try {
        data.signupToken = this.signupToken;
        let result:any = await this.authService.signupComplete(data);
        if(!result.message) {
          
          this.user$.next(result);
          this.user = result
          this.user.accessToken = result['access-token']
          this.signupToken = "";
          localStorage.setItem('currentUser', JSON.stringify(this.user));
        } 
        return this.responseResult(result);
      } catch (error) {
        return {error:error}
      }
   
  }


  async userNameAvailable(data: any): Promise<any> {
    let result = await this.authService.userNameAvailable(data);
    return this.responseResult(result);
  }

  async setUserName(data: any): Promise<any> {
    try {
      let result = await this.authService.setUserName(data); 

      if(result){
        
        this.user.userName = data.userName
        
        localStorage.setItem('currentUser', JSON.stringify(this.user));
      }
      return this.responseResult(result);
    } catch (error) {
      return {error:error};
    }
   
  }


  async socialLogin(token: String, provider:String): Promise<any> {
    try { 
      let result:any = await this.authService.socialLogin({token:token, provider:provider}); 

      if(result && !result.message){  
        this.user$.next(result);
        this.user = result
        this.user.accessToken = result['access-token'] 
        localStorage.setItem('currentUser', JSON.stringify(this.user));
      }
      return this.responseResult(result);

    } catch (error) {
      return {error:error};
    }

    
  }


  async socialSignup(token: String, handle:String, provider:String, displayName:String): Promise<any> {
    try {
       
      let result:any = await this.authService.socialSignup({token:token,  handle:handle, provider:provider, displayName:displayName}); 

      if(result && !result.message){  
        this.user$.next(result);
        this.user = result
        this.user.accessToken = result['access-token'] 
        localStorage.setItem('currentUser', JSON.stringify(this.user));
      }

      return this.responseResult(result);

    } catch (error) {
      return {error:error}
    }
  }


  async verify(): Promise<any> {
    try {
      console.log("this.user.handle ", this.user.handle)
      let result:any = await this.authService.verify({handle: this.user.handle});  
      return this.responseResult(result);

    } catch (error) {
      return {error:error}
    }
  }


  async verifyComplete(attestation:any): Promise<any> {
    try {
       
      let result:any = await this.authService.verifyComplete(this.user.handle, attestation);  
      return this.responseResult(result);

    } catch (error) {
      return {error:error}
    }
  }



  async addPasskey(data:any = null): Promise<any> {
    try {
       
      let result:any = await this.authService.addPasskey(data);  
      return this.responseResult(result);

    } catch (error) {
      return {error:error}
    }
  }

  async addPasskeyComplete(attestation:any): Promise<any> {
    try {
       
      let result:any = await this.authService.addPasskeyComplete(attestation);  
      if(result.authenticators){
        this.user$.next(result);
        this.user = result
      }
      return this.responseResult(result);

    } catch (error) {
      return {error:error}
    }
  }


  async updatePasskey(data:any): Promise<any> {
    try {
       
      let result:any = await this.authService.updatePasskey(data);  
      if(result.authenticators){
        this.user$.next(result);
        this.user = result
      }
      return this.responseResult(result);

    } catch (error) {
      return {error:error}
    }
  }


  async deletePasskey(data:any): Promise<any> {
    try {
       
      let result:any = await this.authService.removePasskey(data); 
      if(result.authenticators){
        this.user$.next(result);
        this.user = result
      } 
      return this.responseResult(result);

    } catch (error) {
      return {error:error}
    }
  }

  async responseResult(params:any) {
    if(params.message && params.code) return {error:params}
    else return params
  }

}
