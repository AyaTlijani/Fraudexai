import { Routes } from '@angular/router';
import { HeroComponent } from './components/hero/hero.component';
import { AdminDashboardComponent } from './components/dashboards/admin-dashboard.component';
import { ForensicConsoleComponent } from './components/dashboards/forensic-console.component';
import { FinancialSecurityHubComponent } from './components/financial-security-hub.component';
import { AuthComponent } from './components/auth/auth.component';
import { ClientHubComponent } from './components/client-hub.component';
import { ClientShellComponent } from './components/client-shell.component';
import { CurrencyConverterComponent } from './components/client/currency-converter/currency-converter.component';
import { CardSecurityCenterComponent } from './components/client/card-security-center/card-security-center.component';
import { AiLaboratoryComponent } from './components/dashboards/ai-laboratory.component';
import { DataAnalystComponent } from './components/dashboards/data-analyst.component';

export const routes: Routes = [
  { path: '', component: HeroComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'select', redirectTo: 'auth' },
  {
    path: 'client-hub',
    component: ClientShellComponent,
    children: [
      { path: '', component: ClientHubComponent },
      { path: 'cards', component: CardSecurityCenterComponent },
      { path: 'converter', component: CurrencyConverterComponent }
    ]
  },
  { path: 'client-dashboard', redirectTo: 'client-hub' },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'ai-lab', component: AiLaboratoryComponent },
  { path: 'data-analyst', component: DataAnalystComponent },
  { path: 'security-hub', component: FinancialSecurityHubComponent },
  { path: 'forensic-console', component: ForensicConsoleComponent },
  { path: 'forensic-console/:id', component: ForensicConsoleComponent },
  { path: '**', redirectTo: '' }
];
