import { Injectable } from '@angular/core';
import { User } from './models/user';
import { environment } from '../environments/environment';
import { BehaviorSubject, Observable,  } from 'rxjs'; 
import localeData from './../locales.json';
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
  public signupToken:String = ""
 
 

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
    this.user$.next(this.user);
    this.signupToken = "";
  }

 
  async getApplication(): Promise<any> {
    let app =  await this.authService.getApp();
   
    if(app.error){ 
      return app
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
    return  await this.authService.updateProfile(data); 
  }


  async login(data: any): Promise<any> {
    
    return await this.authService.login(data); 
  }


  async loginComplete(data: any): Promise<any> {
    let result:any = await this.authService.loginComplete(data.handle, data); 

    if(!result.error) { 
    
      this.user$.next(result);
      this.user = result
      this.user.accessToken = result['access-token'] 
      localStorage.setItem('currentUser', JSON.stringify(this.user));

    } 
    return result;

  }


  async loginAnonymous(): Promise<any> {
    let data = {handle:`ANON_${crypto.randomUUID()}`}
    return await this.authService.loginAnonymous(data); 
  }


  async loginAnonymousComplete(data:any): Promise<any> { 
    let result:any = await this.authService.loginAnonymousComplete(data.handle, data);
    if(!result.error){ 
   
      this.user = result as User
      this.user.accessToken = result['access-token']
      this.user$.next(this.user); 
      
      localStorage.setItem('currentUser', JSON.stringify(this.user));
    }

    return result;
  }


  async signup(data: any): Promise<any> {
    this.signupToken = "";
    return await this.authService.signup( data);
   
  }


  async signupConfirm(data: any): Promise<any> {
    let result:any = await this.authService.signupConfirm(data.handle, data);
    this.signupToken = result['signup-token'] || "";
    return result;
  }


  async signupComplete(data: any): Promise<any> {
    let result:any = await this.authService.signupComplete(data);
    if(!result.error) {
      
      this.user$.next(result);
      this.user = result
      this.user.accessToken = result['access-token']
      this.signupToken = "";
      localStorage.setItem('currentUser', JSON.stringify(this.user));
    } 
    return result;
  }


  async userNameAvailable(data: any): Promise<any> {
    let result = await this.authService.userNameAvailable(data);
    return result;
  }

  async setUserName(data: any): Promise<any> {
    let result = await this.authService.setUserName(data); 

    if(result){
      
      this.user.userName = data.userName
     
      localStorage.setItem('currentUser', JSON.stringify(this.user));
    }
    return result;
  }


  async socialLogin(token: String, provider:String): Promise<any> {
    let result:any = await this.authService.socialLogin({token:token, provider:provider}); 

    if(result && !result.error){  
      this.user$.next(result);
      this.user = result
      this.user.accessToken = result['access-token'] 
      localStorage.setItem('currentUser', JSON.stringify(this.user));
    }

    return result;
  }


  async socialSignup(token: String, handle:String, provider:String, displayName:String): Promise<any> {
    let result:any = await this.authService.socialSignup({token:token,  handle:handle, provider:provider, displayName:displayName}); 

    if(result && !result.error){  
      this.user$.next(result);
      this.user = result
      this.user.accessToken = result['access-token'] 
      localStorage.setItem('currentUser', JSON.stringify(this.user));
    }

    return result;
  }

}
