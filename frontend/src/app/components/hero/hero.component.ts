import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface AnimationState {
  heroVisible: boolean;
  contentVisible: boolean;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent implements OnInit {
  animationState: AnimationState = {
    heroVisible: false,
    contentVisible: false
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Trigger animations on component load
    setTimeout(() => {
      this.animationState.heroVisible = true;
    }, 100);

    setTimeout(() => {
      this.animationState.contentVisible = true;
    }, 300);
  }

  onWelcomeClick(): void {
    console.log('Welcome button clicked');
    // Navigate to single login page.
    this.router.navigate(['/auth']);
  }
}
