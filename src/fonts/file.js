import { jsPDF } from "jspdf";

// import the generated base64 font file
import { font } from "./NotoSansDevanagari-VariableFont_wdth,wght-normal.js";

export const registerNotoFont = (doc) => {
  doc.addFileToVFS("NotoSans.ttf", font);
  doc.addFont("NotoSans.ttf", "NotoSans", "normal");
};