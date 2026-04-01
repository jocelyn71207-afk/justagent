// 全域型別聲明
declare global {
  interface Window {
    viewport: any;
    Konva: any;
    x_spreadsheet: any;
    XLSX: any;
    pdfjsLib: any;
    jsPDF: any;
    html2pdf: any;
    debug: any;
  }
}

// 這行是必要的，讓檔案被視為模組
export {};
