import { Component, OnInit, inject, signal, TemplateRef, WritableSignal } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

@Component({
  selector: 'app-profile', 
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css' 
})
export class ProfileComponent implements OnInit{

  private modalService = inject(NgbModal);
  closeResult: WritableSignal<string> = signal('');

  formData:any = {};
  currentUser: any = {};
  application:any = {};
  locales:Array<any>=[];
  private keyAction:String = ""
  selectedKey?:any
  
  isUpdatingKey:boolean = false

  constructor(private authService: AuthService, private router: Router) { 
    this.currentUser = authService.user;
    if(this.currentUser) {
      this.formData = {
        appId:this.currentUser.appId,
        displayName: this.currentUser.displayName,
        handle: this.currentUser.handle
      }; 
    }
   
    console.log("Profile currentUser ", this.currentUser);
    
    this.authService.user$.subscribe(user => { 
      this.currentUser = user; 
    }); 
    
  }

  async ngOnInit() {

    if(!this.authService.user || !this.authService.user.appUserId ) { 
      this.router.navigate(['login']);
    }
    this.application = await this.authService.getApplication(); 
    this.currentUser = this.authService.user;
    this.locales = this.authService.appLocales;

    console.log("ngOnInit currentUser ", this.currentUser);
  }


  open(content: TemplateRef<any>) {
		this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
			(result) => {
				this.closeResult.set(`Closed with: ${result}`);
			},
			(reason) => {
				this.closeResult.set(`Dismissed ${this.getDismissReason(reason)}`);
			},
		);
	}

	private getDismissReason(reason: any): string {
		switch (reason) {
			case ModalDismissReasons.ESC:
				return 'by pressing ESC';
			case ModalDismissReasons.BACKDROP_CLICK:
				return 'by clicking on a backdrop';
			default:
				return `with: ${reason}`;
		}
	}

  findCountryByLocale(locale:String) {
    let country = this.authService.localeList.filter(item => item.code == locale)[0];
    //if (locale == "EN") return" English (default)";
    return country ;
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


  async openModalVerifyPasskey(content:any, action:string, passkey?:any){
    this.keyAction = action
    if(passkey && passkey.id) this.selectedKey = passkey

    let that = this;
    this.modalService.open(content, {backdrop: 'static', ariaLabelledBy: 'modal-basic-title',}).result.then((result) => {
     
      console.log("result ", result)
     
      that.verifyPasskey();
    }, (reason) => { 
      
      this.keyAction = ""
    }); 
  }


  async verifyPasskey(){
    try {
      
   
      let authOptions:any = await this.authService.verify()
      
      if(authOptions.challenge) { 
        let assertionResponse:any = await startAuthentication({optionsJSON:authOptions});  
        const result:any = await this.authService.verifyComplete(assertionResponse); 

        if(result.authenticators){
          switch (this.keyAction) {
            case 'addPasskey':
              this.addPasskey()
              break;
            case 'updatePasskey':
              this.updatePasskey()
              break;
            case 'deletePasskey':
              this.deletePasskey()
              break;
          
            default:
              break;
          }
        }
        else  alert(result.error.message)
      }
      else {
        alert(authOptions.error.message)
      }
    } catch (error) {
        console.error("error ", error)
    }
  }


  async addPasskey(){
    try {
      
      
      let authOptions = await this.authService.addPasskey()
      let attestationResponse:any = await startRegistration({optionsJSON:authOptions}); 
      console.log("addPasskey this.attestationResponse = ", attestationResponse); 

      const result:any = await this.authService.addPasskeyComplete(attestationResponse); 
      if (result.jwt) {
        alert("Success") 
      } else {
        alert(result.error.message) 
      } 
    } catch (error:any) {
      alert(error.message) 
    }
  }

  async updatePasskey(){
    let resutl = await this.authService.updatePasskey(this.formData)

    if(resutl.error) alert(resutl.error.message)
    else {
      alert("Success")
      this.isUpdatingKey = false
      this.selectedKey = null
    }
  }

  async deletePasskey(){
    let resutl = await this.authService.deletePasskey({keyId: this.selectedKey.id})

    if(resutl.error) alert(resutl.error.message)
    else {
      alert("Success")
      this.selectedKey = null
    }
  }


  onClickEditKey(passkey:any){
    this.isUpdatingKey = true; 
    this.selectedKey = passkey
    this.formData = {keyId:passkey.id ,keyName: passkey.name}
  }

  logout() {
    this.router.navigate(['logout']);
  }
}
