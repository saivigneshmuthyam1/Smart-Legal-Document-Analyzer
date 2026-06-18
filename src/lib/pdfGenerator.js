import { jsPDF } from "jspdf";

/**
 * Generates and downloads a professional Lexicon AI Legal Analysis Report.
 * 
 * @param {Object} currentAnalysis - The live analysis data from backend.
 * @param {Object} settings - The export options from the modal.
 */
export function generateReportPDF(currentAnalysis, settings) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin; // 170mm

  // Color Palette Definitions (RGB)
  const PRIMARY = [15, 23, 42];        // #0F172A - Deep Slate
  const SECONDARY = [30, 41, 59];      // #1E293B - Dark Grey
  const TEXT_DARK = [15, 23, 42];      // Body text dark
  const TEXT_MUTED = [100, 116, 139];   // #64748B - Slate 500
  const BORDER_COLOR = [226, 232, 240]; // #E2E8F0 - Slate 200
  const HIGHLIGHT_BG = [248, 250, 252]; // #F8FAFC - Slate 50

  const RISK_RED = [239, 68, 68];       // Critical
  const RISK_RED_BG = [254, 242, 242];
  const RISK_AMBER = [245, 158, 11];    // Medium
  const RISK_AMBER_BG = [255, 251, 235];
  const RISK_GREEN = [16, 185, 129];    // Low
  const RISK_GREEN_BG = [236, 253, 245];

  // Helper State
  let currentY = margin;

  // Format Date Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const timestampStr = formatDate(currentAnalysis?.created_at);
  const documentId = currentAnalysis?.document_id || "N/A";
  const docType = currentAnalysis?.metadata?.document_type || "Legal Document";
  const parties = currentAnalysis?.metadata?.parties || [];
  const partiesStr = parties.length > 0 ? parties.join(" & ") : "N/A";
  const effectiveDate = currentAnalysis?.metadata?.effective_date || "N/A";

  // Check and create page if space is insufficient
  function checkSpace(heightNeeded) {
    if (currentY + heightNeeded > pageHeight - 25) {
      doc.addPage();
      currentY = 25; // Reset Y with top margin safety
      return true;
    }
    return false;
  }

  // Draw Section Header Helper
  function drawSectionHeader(title) {
    checkSpace(20);
    currentY += 8;
    
    // Draw section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(title, margin, currentY);
    currentY += 4;
    
    // Underline divider
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  }

  // Draw Badge Helper
  function drawBadge(text, x, y, bgColor, textColor) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    
    const textWidth = doc.getTextWidth(text);
    const badgeW = textWidth + 4;
    const badgeH = 5;
    
    // Background
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(x, y, badgeW, badgeH, 1, 1, "F");
    
    // Text
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(text, x + 2, y + 3.7);
    
    return badgeW;
  }

  // ==========================================
  // COVER PAGE (Always generated first)
  // ==========================================
  // Branded Top Header Banner
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, pageWidth, 90, "F");

  // Logo Placeholder Icon (Scales of Justice)
  // Base Stand
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.2);
  doc.line(pageWidth / 2, 28, pageWidth / 2, 58); // Vertical pillar
  doc.line(pageWidth / 2 - 10, 58, pageWidth / 2 + 10, 58); // Base foot
  
  // Beam
  doc.line(pageWidth / 2 - 20, 34, pageWidth / 2 + 20, 34); // Balance beam
  
  // Plates
  // Left Plate
  doc.line(pageWidth / 2 - 20, 34, pageWidth / 2 - 25, 48);
  doc.line(pageWidth / 2 - 20, 34, pageWidth / 2 - 15, 48);
  doc.line(pageWidth / 2 - 27, 48, pageWidth / 2 - 13, 48);
  // Right Plate
  doc.line(pageWidth / 2 + 20, 34, pageWidth / 2 + 15, 48);
  doc.line(pageWidth / 2 + 20, 34, pageWidth / 2 + 25, 48);
  doc.line(pageWidth / 2 + 13, 48, pageWidth / 2 + 27, 48);

  // Title Text inside Dark Banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  const brandTitle = "LEXICON AI";
  const brandTitleW = doc.getTextWidth(brandTitle);
  doc.text(brandTitle, (pageWidth - brandTitleW) / 2, 72);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225); // Slate 300
  const brandSub = "Smart Legal Document Analyzer";
  const brandSubW = doc.getTextWidth(brandSub);
  doc.text(brandSub, (pageWidth - brandSubW) / 2, 79);

  // Body content for Cover Page
  currentY = 120;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  const docReportTitle = "LEGAL COMPLIANCE & RISK REPORT";
  const docReportTitleW = doc.getTextWidth(docReportTitle);
  doc.text(docReportTitle, (pageWidth - docReportTitleW) / 2, currentY);
  
  currentY += 15;

  // Metadata Panel Box
  const boxHeight = 70;
  const boxY = currentY;
  doc.setFillColor(HIGHLIGHT_BG[0], HIGHLIGHT_BG[1], HIGHLIGHT_BG[2]);
  doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, boxY, contentWidth, boxHeight, 2, 2, "FD");

  let metadataY = boxY + 10;
  const drawMetaRow = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text(label, margin + 8, metadataY);
    
    doc.setFont("helvetica", "medium");
    doc.setFontSize(10);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    
    // Handle text overflow for long metadata values
    const valMaxWidth = contentWidth - 55;
    const splitVal = doc.splitTextToSize(String(value), valMaxWidth);
    
    let tempY = metadataY;
    splitVal.forEach((line) => {
      doc.text(line, margin + 45, tempY);
      tempY += 5;
    });
    
    metadataY = Math.max(metadataY + 8, tempY + 3);
  };

  drawMetaRow("Document Type:", docType);
  drawMetaRow("Parties involved:", partiesStr);
  drawMetaRow("Effective Date:", effectiveDate);
  drawMetaRow("Document ID:", documentId);
  drawMetaRow("Report Date:", timestampStr);

  // Bottom Notice
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  const footerNotice = "This document is generated automatically by Lexicon AI based on machine learning analysis models.";
  const footerNoticeW = doc.getTextWidth(footerNotice);
  doc.text(footerNotice, (pageWidth - footerNoticeW) / 2, pageHeight - 20);

  // ==========================================
  // EXECUTIVE SUMMARY SECTION
  // ==========================================
  if (settings.summary) {
    doc.addPage();
    currentY = 25; // Reset Y

    drawSectionHeader("1. Executive Summary");

    const summaryObj = currentAnalysis?.summary || {};
    const mainSummaryText = summaryObj.main_summary || "No executive summary available for this document.";
    
    // Render main summary paragraphs
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    const splitSummary = doc.splitTextToSize(mainSummaryText, contentWidth);
    
    splitSummary.forEach((line) => {
      checkSpace(6);
      doc.text(line, margin, currentY);
      currentY += 6;
    });

    currentY += 4;

    // TL;DR Highlight box (if exists)
    if (summaryObj.tldr) {
      const tldrText = `TL;DR: ${summaryObj.tldr}`;
      const padding = 6;
      const innerWidth = contentWidth - (padding * 2);
      const splitTldr = doc.splitTextToSize(tldrText, innerWidth);
      const calculatedHeight = (splitTldr.length * 5) + (padding * 2);

      checkSpace(calculatedHeight + 5);

      // Light background
      doc.setFillColor(RISK_GREEN_BG[0], RISK_GREEN_BG[1], RISK_GREEN_BG[2]);
      doc.roundedRect(margin, currentY, contentWidth, calculatedHeight, 1.5, 1.5, "F");

      // Left Accent bar
      doc.setFillColor(RISK_GREEN[0], RISK_GREEN[1], RISK_GREEN[2]);
      doc.rect(margin, currentY, 1.5, calculatedHeight, "F");

      // Render TL;DR text
      doc.setFont("helvetica", "oblique");
      doc.setFontSize(9.5);
      doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      
      let textY = currentY + padding + 3;
      splitTldr.forEach((line) => {
        doc.text(line, margin + padding + 2, textY);
        textY += 5;
      });

      currentY += calculatedHeight + 8;
    }

    // Key points bullet list
    if (summaryObj.key_points && summaryObj.key_points.length > 0) {
      checkSpace(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text("Key Takeaways", margin, currentY);
      currentY += 6;

      summaryObj.key_points.forEach((point) => {
        const bulletText = `•  ${point}`;
        const splitPoint = doc.splitTextToSize(bulletText, contentWidth - 6);
        const pointHeight = splitPoint.length * 5 + 2;

        checkSpace(pointHeight);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);

        splitPoint.forEach((line) => {
          doc.text(line, margin + 3, currentY);
          currentY += 5;
        });
        currentY += 2;
      });
      currentY += 4;
    }
  }

  // ==========================================
  // CLAUSE ANALYSIS SECTION
  // ==========================================
  if (settings.clauses) {
    if (doc.internal.getNumberOfPages() > 1 || settings.summary) {
      doc.addPage();
      currentY = 25;
    }
    
    drawSectionHeader("2. Clause Analysis");

    const clausesObj = currentAnalysis?.clauses || {};
    const standardClauses = clausesObj.standard_clauses || [];
    const nonStandardClauses = clausesObj.non_standard_clauses || [];

    const allClauses = [
      ...standardClauses.map(c => ({ ...c, isStandard: true })),
      ...nonStandardClauses.map(c => ({ ...c, isStandard: false }))
    ];

    if (allClauses.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text("No key clauses extracted for analysis.", margin, currentY);
      currentY += 8;
    } else {
      allClauses.forEach((clause) => {
        const titleText = clause.title || "Untitled Clause";
        const contentText = clause.content || "No clause content detected.";
        
        // Split content text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        const splitContent = doc.splitTextToSize(`"${contentText}"`, contentWidth - 10);
        
        // Calculate card height
        // Header (8mm) + content lines (lineCount * 5) + padding & margins (14mm)
        const cardH = 8 + (splitContent.length * 5) + 12;
        
        checkSpace(cardH);

        // Draw Card border box
        doc.setFillColor(HIGHLIGHT_BG[0], HIGHLIGHT_BG[1], HIGHLIGHT_BG[2]);
        doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, currentY, contentWidth, cardH, 1.5, 1.5, "FD");

        // Vertical Accent bar
        const accentCol = clause.isStandard ? PRIMARY : RISK_AMBER;
        doc.setFillColor(accentCol[0], accentCol[1], accentCol[2]);
        doc.rect(margin, currentY, 1.5, cardH, "F");

        // Header Row
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
        doc.text(titleText, margin + 5, currentY + 6);

        // Badge
        const badgeLabel = clause.isStandard ? "STANDARD" : "NON-STANDARD";
        const badgeBg = clause.isStandard ? HIGHLIGHT_BG : RISK_AMBER_BG;
        const badgeTextCol = clause.isStandard ? TEXT_MUTED : RISK_AMBER;
        
        const badgeW = doc.getTextWidth(badgeLabel) + 4;
        drawBadge(badgeLabel, pageWidth - margin - badgeW - 5, currentY + 2.5, badgeBg, badgeTextCol);

        // Divider line in card
        doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
        doc.setLineWidth(0.2);
        doc.line(margin + 5, currentY + 9, pageWidth - margin - 5, currentY + 9);

        // Content
        doc.setFont("times", "italic");
        doc.setFontSize(10);
        doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
        
        let contentY = currentY + 14;
        splitContent.forEach((line) => {
          doc.text(line, margin + 6, contentY);
          contentY += 5;
        });

        currentY += cardH + 6;
      });
    }
  }

  // ==========================================
  // RISK ANALYSIS SECTION
  // ==========================================
  if (settings.risks) {
    if (doc.internal.getNumberOfPages() > 1 || settings.summary || settings.clauses) {
      doc.addPage();
      currentY = 25;
    }

    drawSectionHeader("3. Risk Analysis");

    const risksArr = currentAnalysis?.risks || [];

    if (risksArr.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text("No compliance or legal risks detected in this document.", margin, currentY);
      currentY += 8;
    } else {
      risksArr.forEach((risk) => {
        const severity = (risk.severity || "Low").toLowerCase();
        const isHigh = severity === "high" || risk.severity_weight === 3;
        const isMed = severity === "medium" || risk.severity_weight === 2;

        const badgeLabel = isHigh ? "CRITICAL RISK" : isMed ? "MEDIUM RISK" : "LOW RISK";
        const badgeBg = isHigh ? RISK_RED_BG : isMed ? RISK_AMBER_BG : RISK_GREEN_BG;
        const badgeTextCol = isHigh ? RISK_RED : isMed ? RISK_AMBER : RISK_GREEN;
        const cardAccent = badgeTextCol;

        const explanation = risk.description || risk.explanation || "No explanation details provided.";

        // Split text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        const splitExplain = doc.splitTextToSize(explanation, contentWidth - 12);
        
        const cardH = 8 + (splitExplain.length * 5) + 12;
        
        checkSpace(cardH);

        // Draw Card border box
        doc.setFillColor(HIGHLIGHT_BG[0], HIGHLIGHT_BG[1], HIGHLIGHT_BG[2]);
        doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, currentY, contentWidth, cardH, 1.5, 1.5, "FD");

        // Vertical Accent bar
        doc.setFillColor(cardAccent[0], cardAccent[1], cardAccent[2]);
        doc.rect(margin, currentY, 1.5, cardH, "F");

        // Header Row - Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
        doc.text(risk.title || "Unspecified Compliance Issue", margin + 5, currentY + 6);

        // Badge
        const badgeW = doc.getTextWidth(badgeLabel) + 4;
        drawBadge(badgeLabel, pageWidth - margin - badgeW - 5, currentY + 2.5, badgeBg, badgeTextCol);

        // Divider line in card
        doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
        doc.setLineWidth(0.2);
        doc.line(margin + 5, currentY + 9, pageWidth - margin - 5, currentY + 9);

        // Description/Explanation text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);

        let explainY = currentY + 14;
        splitExplain.forEach((line) => {
          doc.text(line, margin + 6, explainY);
          explainY += 5;
        });

        currentY += cardH + 6;
      });
    }
  }

  // ==========================================
  // METADATA & EXTRAS SECTION
  // ==========================================
  if (settings.metadata) {
    if (doc.internal.getNumberOfPages() > 1 || settings.summary || settings.clauses || settings.risks) {
      doc.addPage();
      currentY = 25;
    }

    drawSectionHeader("4. Analysis Summary & Metadata");

    // Let's draw KPI grids or details depending on checkboxes
    const risks = currentAnalysis?.risks || [];
    const clauses = currentAnalysis?.clauses || {};
    
    const standardClausesCount = clauses.standard_clauses?.length || 0;
    const nonStandardClausesCount = clauses.non_standard_clauses?.length || 0;
    const totalClauses = standardClausesCount + nonStandardClausesCount;

    const highCount = risks.filter(r => r.severity_weight === 3 || (r.severity || "").toLowerCase() === "high").length;
    const medCount = risks.filter(r => r.severity_weight === 2 || (r.severity || "").toLowerCase() === "medium").length;
    const lowCount = risks.filter(r => r.severity_weight === 1 || (r.severity || "").toLowerCase() === "low").length;
    
    const overallRiskScore = risks.length > 0
      ? (risks.reduce((sum, r) => sum + (r.severity_weight || 1), 0) / risks.length * 3.33).toFixed(1)
      : "0.0";

    const scoreNum = parseFloat(overallRiskScore);
    const riskLabel = scoreNum >= 7 ? "HIGH RISK" : scoreNum >= 4 ? "MODERATE RISK" : "LOW RISK";
    const riskColor = scoreNum >= 7 ? RISK_RED : scoreNum >= 4 ? RISK_AMBER : RISK_GREEN;
    const riskBg = scoreNum >= 7 ? RISK_RED_BG : scoreNum >= 4 ? RISK_AMBER_BG : RISK_GREEN_BG;

    // 1. Risk Score Block
    if (settings.riskScore) {
      checkSpace(35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text("Compliance Exposure Scorecard", margin, currentY);
      currentY += 6;

      // Draw box for Risk Score
      doc.setFillColor(riskBg[0], riskBg[1], riskBg[2]);
      doc.setDrawColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, currentY, contentWidth, 22, 1.5, 1.5, "FD");

      // Draw left red/amber/green strip
      doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.rect(margin, currentY, 2, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.text(overallRiskScore, margin + 8, currentY + 15);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text("/ 10.0 Index Score", margin + 27, currentY + 10);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.text(`Classification: ${riskLabel}`, margin + 27, currentY + 16);

      currentY += 30;
    }

    // 2. Statistics Grid
    if (settings.stats) {
      checkSpace(55);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text("Analysis Statistics Metrics", margin, currentY);
      currentY += 6;

      // Draw standard and non-standard metrics boxes side by side
      const colWidth = (contentWidth - 6) / 2;

      // Left Box: Clauses
      doc.setFillColor(HIGHLIGHT_BG[0], HIGHLIGHT_BG[1], HIGHLIGHT_BG[2]);
      doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
      doc.roundedRect(margin, currentY, colWidth, 32, 1, 1, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text("CLAUSE EXTRACTION STATUS", margin + 6, currentY + 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text(`${totalClauses} Clauses`, margin + 6, currentY + 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(`• Standard Clauses: ${standardClausesCount}`, margin + 6, currentY + 24);
      doc.text(`• Non-Standard: ${nonStandardClausesCount}`, margin + 6, currentY + 28);

      // Right Box: Risks
      doc.setFillColor(HIGHLIGHT_BG[0], HIGHLIGHT_BG[1], HIGHLIGHT_BG[2]);
      doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
      doc.roundedRect(margin + colWidth + 6, currentY, colWidth, 32, 1, 1, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      doc.text("COMPLIANCE RISK PROFILE", margin + colWidth + 12, currentY + 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text(`${risks.length} Risks Detected`, margin + colWidth + 12, currentY + 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(`• Critical (High): ${highCount}`, margin + colWidth + 12, currentY + 24);
      doc.text(`• Moderate / Low: ${medCount + lowCount}`, margin + colWidth + 12, currentY + 28);

      currentY += 40;
    }

    // 3. Document Details Box (if docInfo is selected and not already fully displayed on Cover)
    if (settings.docInfo) {
      checkSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text("Document Reference Details", margin, currentY);
      currentY += 6;

      doc.setFillColor(HIGHLIGHT_BG[0], HIGHLIGHT_BG[1], HIGHLIGHT_BG[2]);
      doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
      doc.roundedRect(margin, currentY, contentWidth, 22, 1, 1, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
      doc.text(`• Document Identifier: ${documentId}`, margin + 6, currentY + 7);
      doc.text(`• Contract Parties: ${partiesStr}`, margin + 6, currentY + 13);
      doc.text(`• Effective Date: ${effectiveDate} | Type: ${docType}`, margin + 6, currentY + 18);

      currentY += 30;
    }

    // 4. Generated Timestamp
    if (settings.timestamp) {
      checkSpace(15);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
      const nowStr = new Date().toLocaleString("en-US", { 
        year: "numeric", month: "long", day: "numeric", 
        hour: "2-digit", minute: "2-digit", second: "2-digit", 
        timeZoneName: "short" 
      });
      doc.text(`Report export timestamp record: ${nowStr}`, margin, currentY);
      currentY += 8;
    }
  }

  // ==========================================
  // POST-PROCESSING: HEADER & FOOTER ON SUBSEQUENT PAGES
  // ==========================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Header text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text("LEXICON AI", margin, 12);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    const headerTitle = "Smart Legal Document Analyzer - Analysis Report";
    const headerTitleW = doc.getTextWidth(headerTitle);
    doc.text(headerTitle, pageWidth - margin - headerTitleW, 12);

    // Header divider line
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, 15, pageWidth - margin, 15);

    // Footer divider line
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.text("Confidential Compliance Audit Report", margin, pageHeight - 10);
    
    // Page numbering right-aligned
    const pageNumText = `Page ${i} of ${totalPages}`;
    const pageNumTextW = doc.getTextWidth(pageNumText);
    doc.text(pageNumText, pageWidth - margin - pageNumTextW, pageHeight - 10);
  }

  // Save the PDF file
  const filename = `${docType.replace(/\s+/g, "_")}_Compliance_Analysis_${documentId.substring(0, 8)}.pdf`;
  doc.save(filename);
}
