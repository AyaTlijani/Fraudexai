import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface FeatureCorr { name: string; value: number; }
interface ModelResult {
  name: string; icon: string; color: string;
  precision: number; recall: number; f1: number; auc: number;
  tp: number; fp: number; fn: number; tn: number;
  verdict: string; verdictColor: string;
}
interface Improvement {
  id: string; title: string; impact: string; complexity: string;
  priority: 'immediate' | 'medium' | 'advanced'; description: string;
  code?: string;
}

@Component({
  selector: 'app-data-analyst',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-analyst.component.html',
  styleUrls: ['./data-analyst.component.scss']
})
export class DataAnalystComponent implements OnInit {
  activeTab: 'dataset' | 'eda' | 'models' | 'improvements' = 'dataset';

  // ── Dataset stats ──────────────────────────────────────────────────────────
  datasetStats = {
    rawRows: 284807, cleanRows: 283726, columns: 31,
    duplicates: 1081, missing: 0,
    fraudCount: 473, legitCount: 283253,
    fraudPct: 0.1667, legitPct: 99.8333,
    ratio: 599,
    fraudAmountMean: 123.87, legitAmountMean: 88.41,
    fraudAmountMax: 2125.87, legitAmountMax: 25691.16
  };

  descriptiveStats = [
    { stat: 'count',  time: '283 726', amount: '283 726', cls: '283 726' },
    { stat: 'mean',   time: '94 811',  amount: '88.47 €',  cls: '0.0017' },
    { stat: 'std',    time: '47 481',  amount: '250.40 €', cls: '0.0408' },
    { stat: 'min',    time: '0',       amount: '0.00 €',   cls: '0' },
    { stat: '25%',    time: '54 204',  amount: '5.60 €',   cls: '0' },
    { stat: 'median', time: '84 692',  amount: '22.00 €',  cls: '0' },
    { stat: '75%',    time: '139 298', amount: '77.51 €',  cls: '0' },
    { stat: 'max',    time: '172 792', amount: '25 691 €', cls: '1' }
  ];

  // ── EDA ────────────────────────────────────────────────────────────────────
  featureCorrelations: FeatureCorr[] = [
    { name: 'V17', value: 0.3135 }, { name: 'V14', value: 0.2934 },
    { name: 'V12', value: 0.2507 }, { name: 'V10', value: 0.2070 },
    { name: 'V16', value: 0.1872 }, { name: 'V3',  value: 0.1823 },
    { name: 'V7',  value: 0.1723 }, { name: 'V11', value: 0.1491 },
    { name: 'V4',  value: 0.1293 }, { name: 'V18', value: 0.1053 },
    { name: 'V1',  value: 0.0945 }, { name: 'V9',  value: 0.0940 },
    { name: 'V5',  value: 0.0878 }, { name: 'V2',  value: 0.0846 },
    { name: 'V6',  value: 0.0439 }
  ];

  get maxCorr(): number { return this.featureCorrelations[0].value; }
  corrBarWidth(val: number): number { return (val / this.maxCorr) * 100; }

  // ── Models ────────────────────────────────────────────────────────────────
  models: ModelResult[] = [
    {
      name: 'Autoencoder', icon: '🧩', color: '#00ff88',
      precision: 0.928, recall: 0.964, f1: 0.946, auc: 0.956,
      tp: 92, fp: 7, fn: 3, tn: 56644,
      verdict: 'RECOMMANDÉ — meilleure performance globale', verdictColor: '#00ff88'
    },
    {
      name: 'Transformer', icon: '🧠', color: '#00d9ff',
      precision: 0.894, recall: 0.932, f1: 0.913, auc: 0.923,
      tp: 89, fp: 11, fn: 6, tn: 56640,
      verdict: 'Très performant — excellent rappel', verdictColor: '#ffcc44'
    },
    {
      name: 'Attention', icon: '🎯', color: '#6c63ff',
      precision: 0.885, recall: 0.912, f1: 0.899, auc: 0.917,
      tp: 87, fp: 11, fn: 8, tn: 56640,
      verdict: 'Solide — performant sur les patterns sequentiels', verdictColor: '#ffcc44'
    }
  ];

  selectedModel: ModelResult | null = null;

  cmCellColor(tp: number, fp: number, fn: number, tn: number, cell: 'tp'|'fp'|'fn'|'tn'): string {
    if (cell === 'tp') return '#00ff8833';
    if (cell === 'tn') return '#1a1a3e';
    if (cell === 'fp') return '#ff990033';
    if (cell === 'fn') return '#ff005533';
    return '#1a1a3e';
  }

  // SVG ROC curves (simplified polyline points)
  rocPoints(model: ModelResult): string {
    const auc = model.auc;
    const pts: string[] = [
      '0,200', `${Math.round(10*(1-auc)*2)},${Math.round(200-auc*160)}`,
      `${Math.round(200*(1-auc)*0.5)},${Math.round(200-auc*190)}`, '200,0'
    ];
    return pts.join(' ');
  }

  // ── Improvements ─────────────────────────────────────────────────────────
  improvements: Improvement[] = [
    {
      id: 'A', title: 'Threshold Tuning', impact: '+++', complexity: '⭐ Facile',
      priority: 'immediate',
      description: 'Ajuster le seuil de decision de l\'Autoencoder pour augmenter le Recall de 0.964 vers 0.97+ sans re-entrainement complet.',
      code: `precisions, recalls, thresholds = precision_recall_curve(y_test, y_scores_autoencoder)\nf1_scores = 2 * precisions * recalls / (precisions + recalls + 1e-8)\noptimal_threshold = thresholds[np.argmax(f1_scores)]`
    },
    {
      id: 'B', title: 'Tuning Transformer', impact: '++', complexity: '⭐⭐ Moyen',
      priority: 'immediate',
      description: 'Optimiser le Transformer (num_heads, d_model, dropout, learning_rate) pour reduire les faux negatifs sur les sequences critiques.',
      code: `transformer_cfg = {"num_heads": 8, "d_model": 128, "dropout": 0.1}\noptimizer = AdamW(transformer.parameters(), lr=1e-4)\n# Train + validation recall-focused tuning`
    },
    {
      id: 'C', title: 'Tuning Attention', impact: '+++', complexity: '⭐⭐ Moyen',
      priority: 'immediate',
      description: 'Ajuster les couches d\'attention (attention_dropout, hidden_size, context_window) pour mieux capter les signaux de fraude faibles.',
    },
    {
      id: 'D', title: 'SMOTETomek / ADASYN', impact: '++', complexity: '⭐⭐ Moyen',
      priority: 'medium',
      description: 'Remplacer SMOTE basique par SMOTETomek (frontière plus nette) ou ADASYN (adaptatif). Semaine 2.',
    },
    {
      id: 'E', title: 'Stacking Ensemble', impact: '++', complexity: '⭐⭐⭐ Élevé',
      priority: 'medium',
      description: 'Combiner Autoencoder + Transformer + Attention dans un meta-ensemble. Impact estimé : +2 à +5% F1-Score.',
    },
    {
      id: 'F', title: 'Cross-Validation 5-Fold', impact: '+', complexity: '⭐ Facile',
      priority: 'medium',
      description: 'Remplacer l\'évaluation simple par StratifiedKFold(5) pour des métriques plus robustes.',
    },
    {
      id: 'G', title: 'Feature Engineering', impact: '+++', complexity: '⭐⭐ Moyen',
      priority: 'medium',
      description: 'Créer hour_of_day, is_night, is_weekend depuis Time. Log-transform Amount. Montants ronds = suspects.',
    },
    {
      id: 'H', title: 'Deep Learning MLP', impact: '+++', complexity: '⭐⭐⭐⭐ Élevé',
      priority: 'advanced',
      description: '4 couches Dense (128→64→32→1) avec BatchNorm + Dropout. 283K samples → réseau de neurones compétitif.',
    },
    {
      id: 'I', title: 'Autoencoder Anomalie', impact: '++++', complexity: '⭐⭐⭐⭐ Élevé',
      priority: 'advanced',
      description: 'Entraîner uniquement sur légitimes. Fraude = erreur de reconstruction élevée. Détecte les nouvelles fraudes inconnues.',
    },
    {
      id: 'J', title: 'MLOps Monitoring', impact: 'maintenance', complexity: '⭐⭐⭐⭐⭐ Expert',
      priority: 'advanced',
      description: 'Surveiller data drift, concept drift, latence (<50ms), Recall prod (<0.75 = alerte), FP rate (<0.1%).',
    }
  ];

  activeImprovement: Improvement | null = null;

  priorityLabel(p: string): string {
    if (p === 'immediate') return '🔴 Immédiat';
    if (p === 'medium')    return '🟡 Semaine 2-3';
    return '🟢 Long terme';
  }

  constructor(private router: Router) {}

  ngOnInit() {
    this.selectedModel = this.models[0]; // Autoencoder par defaut
    this.activeImprovement = this.improvements[0];
  }

  setTab(tab: 'dataset' | 'eda' | 'models' | 'improvements') {
    this.activeTab = tab;
  }

  goBack() { this.router.navigate(['/admin-dashboard']); }
}

