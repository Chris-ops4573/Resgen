import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ResumeBuilder from "./screens/ResumeBuilder";
import PdfPreview from "./screens/PdfPreview"; // NEW

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ResumeBuilder />} />
        <Route path="/preview" element={<PdfPreview />} /> {/* NEW */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
