import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) {} 

  async ngOnInit(): Promise<void> {
   this.authService.logout()
   this.router.navigate(['login']);
  }

}
