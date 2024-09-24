import { Injectable } from '@angular/core';
import { User } from './models/user';
import { environment } from '../environments/environment';
import { BehaviorSubject, Observable,  } from 'rxjs'; 

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  public user$: BehaviorSubject<User>;
  public user:User = new User() 
  public application:any = {}
  REST_API = environment.server.REST_API;
 

  constructor() { 

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


  }

  async isLoggedin(): Promise<boolean> {
    try {
      return false;
    } catch (error) {
      console.log({ error });
      return false;
    }
  }
 


  async apiRequest(method:string, endpoint:string, data:any): Promise<any> {
    try {

      let options:any = {
        method: method ? method : 'POST',
        headers: {
          'Content-Type': 'application/json', 
        } 
      };

      if(this.user.accessToken != "") options.headers['access-token'] = this.user.accessToken;
      else options.headers['app-token'] = environment.server.APP_TOKEN

      if(method == "POST" || method == "PUT") options.body = JSON.stringify(data);

      const response = await fetch(`${this.REST_API}/api/${endpoint}`, options);
      let result = await response.json();

      console.log(`apiRequest path: ${endpoint} - result: `, result)

      if(response.status !== 200) return {error:result}
      else return result 

    } catch (error) {
      console.log(`apiRequest error:`, error)
    }
  }

  logout(){
    localStorage.clear(); 
    this.user = new User() 
    this.user$.next(this.user);
  }

 
  async getApplication(): Promise<any> {
    this.application =  await this.apiRequest("GET", "appuser/app", null);
    return this.application;
  }



  async updateProfile(data:any): Promise<any> {
    return await this.apiRequest("POST", "appuser/updateProfile", data);
  }


  async login(data: any): Promise<any> {
    return await this.apiRequest("POST", "appuser/login", data);
  }


  async loginComplete(data: any): Promise<any> {
    let result = await this.apiRequest("POST", "appuser/loginComplete", data);

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
    return await this.apiRequest("POST", "appuser/loginAnonymous", data);
  }


  async loginAnonymousComplete(data:any): Promise<any> { 
    let result = await this.apiRequest("POST", "appuser/loginAnonymousComplete", data);
    if(!result.error) {
      
      this.user$.next(result);
      this.user = result
      this.user.accessToken = result['access-token']
      localStorage.setItem('currentUser', JSON.stringify(this.user));
    } 
    return result;
  }


  async signup(data: any): Promise<any> {
    return await this.apiRequest("POST", "appuser/signup", data);
  }


  async signupConfirm(data: any): Promise<any> {
    return await this.apiRequest("POST", "appuser/signupConfirm", data);
  }


  async signupComplete(data: any): Promise<any> {
    let result = await this.apiRequest("POST", "appuser/signupComplete", data);
    if(!result.error) {
      
      this.user$.next(result);
      this.user = result
      this.user.accessToken = result['access-token']
      localStorage.setItem('currentUser', JSON.stringify(this.user));
    } 
    return result;
  }


  async userNameAvailable(data: any): Promise<any> {
    let result = await this.apiRequest("POST", "appuser/userNameAvailable", data);
    return result;
  }

  async setUsername(data: any): Promise<any> {
    let result = await this.apiRequest("POST", "appuser/setUserName", data); 

    if(result){
      
      this.user.userName = data.userName
     
      localStorage.setItem('currentUser', JSON.stringify(this.user));
    }
    return result;
  }

}
