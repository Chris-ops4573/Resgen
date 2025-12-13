import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ResumeBuilder from "./screens/ResumeBuilder";
import PdfPreview from "./screens/PdfPreview"; 
import InterviewSession from "./screens/InterviewSession";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ResumeBuilder />} />
        <Route path="/preview" element={<PdfPreview />} /> 
        <Route path="/interview/:sessionId" element={<InterviewSession />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
