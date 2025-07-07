import { Chart } from '../types';

class ReportService {
  private readonly STORAGE_KEY = 'savedReports';

  getReports(): Chart[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
      return [];
    }
  }

  saveReport(report: Chart): void {
    try {
      const reports = this.getReports();
      reports.push(report);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rapport:', error);
      throw new Error('Impossible de sauvegarder le rapport');
    }
  }

  deleteReport(reportId: string): void {
    try {
      const reports = this.getReports();
      const updatedReports = reports.filter(report => report.id !== reportId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Erreur lors de la suppression du rapport:', error);
      throw new Error('Impossible de supprimer le rapport');
    }
  }
}

export default new ReportService();