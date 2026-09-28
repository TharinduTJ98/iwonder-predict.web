import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Dashboard } from '../pages/dashboard/dashboard';
import { PanelComparison } from '../pages/panel-comparison/panel-comparison';

@Component({
  selector: 'app-root',
  imports: [CommonModule, Dashboard, PanelComparison],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  activeView: 'dashboard' | 'panel-comparison' = 'dashboard';
}
