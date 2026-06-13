import { useState } from "react";
import jsPDF from "jspdf";
import { registerNotoFont } from "./fonts/file";
import "./App.css";

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [userPath, setUserPath] = useState("");
  const [loading, setLoading] = useState(false);

  // Convert ArrayBuffer → Hex
  const bufferToHex = (buffer) => {
    return [...new Uint8Array(buffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  };

  // SHA-256 hash function
  const hashFile = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    return bufferToHex(hashBuffer);
  };

  // Handle file/folder selection
  const handleFiles = async (files) => {
    setLoading(true);

    try {
      const hashedResults = await Promise.all(
        files.map(async (file) => {
          const hash = await hashFile(file);

          return {
            fileName: file.name,
            relativePath: file.webkitRelativePath || file.name,
            userPath: userPath, // manual forensic label
            fullPath:
              userPath + "\\" + file.webkitRelativePath.split("/").pop(),
            hash,
          };
        }),
      );

      setResults(hashedResults);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    setResults([]);
    setFiles(Array.from(e.target.files));
  };
  const handleGenerate = () => {
    handleFiles(files);
  };

  // PDF Export (Forensic style like PowerShell)
  const generatePDF = () => {
    const doc = new jsPDF();

    let y = 20;

    // Unicode-friendly font

    registerNotoFont(doc);
    doc.setFont("NotoSans");

    doc.setFontSize(14);
    doc.text("SHA-256 HASH REPORT", 14, y);

    y += 10;

    doc.setFontSize(10);
    doc.text("Hash", 14, y);
    doc.text("Path", 110, y);

    y += 5;

    doc.text("----", 14, y);
    doc.text("----", 110, y);

    y += 10;

    results.forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const hashLines = doc.splitTextToSize(item.hash, 90);

      // IMPORTANT: Hindi-safe text
      const pathLines = doc.splitTextToSize(
        String(item.fullPath || item.relativePath),
        90,
      );

      doc.text(hashLines, 14, y);
      doc.text(pathLines, 110, y);

      const lines = Math.max(hashLines.length, pathLines.length);
      y += lines * 6 + 5;
    });

    doc.save("hash_report.pdf");
  };

  return (
    <div className="app-container">
      <h2 className="title">🔐 SHA-256 Hash Calculator (Forensic Tool)</h2>

      {/* INPUT SECTION */}
      <div className="controls">
        <input
          type="text"
          placeholder="Enter folder path (for report only)"
          value={userPath}
          onChange={(e) => setUserPath(e.target.value)}
          className="path-input"
          required
        />

        <input
          type="file"
          multiple
          webkitdirectory="true"
          onChange={handleFileSelect}
          className="file-input"
        />

        {files.length > 0 && userPath && (
          <button onClick={handleGenerate} disabled={loading} className="btn">
            {loading ? "Generating..." : "Generate"}
          </button>
        )}

        {results.length > 0 && (
          <button
            onClick={generatePDF}
            disabled={!results.length}
            className="btn export"
          >
            Export PDF
          </button>
        )}
      </div>

      {/* LOADING STATE */}
      {loading && <div className="loading">Processing files...</div>}

      {/* TABLE */}
      {results.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hash</th>
                <th>{userPath ? "Full Path" : "Relative Path"}</th>
              </tr>
            </thead>

            <tbody>
              {results.map((item, i) => (
                <tr key={i}>
                  <td className="mono">{item.hash}</td>
                  <td>{userPath ? item.fullPath : item.relativePath}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
