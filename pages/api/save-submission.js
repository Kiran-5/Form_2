// pages/api/save-submission.js
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { ranked_criteria, comparisons } = req.body;

    // Validate input
    if (!ranked_criteria || !comparisons) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Save data to database
    const { data: submissionData, error: submissionError } = await supabase
      .from('submissions')
      .insert([
        {
          ranked_criteria,
          comparisons,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (submissionError) {
      console.error('Database error:', submissionError);
      return res.status(500).json({ error: 'Failed to save data: ' + submissionError.message });
    }

    const submissionId = submissionData[0].id;

    // Generate PDF that matches frontend exactly
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(30, 50, 100);
    doc.text('Laptop Selection Criteria Weighing', 105, 20, null, null, 'center');
    
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    // Step 1: Ranked Criteria Section
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Step 1: Rank Criteria by Importance', 20, 40);
    
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text('(Ranked from most important to least important)', 20, 47);
    
    // Criteria list with ranks
    const criteriaList = [
      { id: 'C-1', name: 'Performance' },
      { id: 'C-2', name: 'Battery Life' },
      { id: 'C-3', name: 'Display Quality' },
      { id: 'C-4', name: 'Portability' },
      { id: 'C-5', name: 'Price' }
    ];
    
    // Create ranked criteria mapping
    const rankedMap = {};
    ranked_criteria.forEach((criterion, index) => {
      rankedMap[criterion.id] = {
        name: criterion.name,
        rank: index + 1
      };
    });
    
    // Draw criteria table
    let yPosition = 60;
    doc.setFontSize(14);
    
    criteriaList.forEach((criterion, index) => {
      const rankInfo = rankedMap[criterion.id];
      
      // Draw background for alternating rows
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPosition - 7, 170, 12, 'F');
      }
      
      // Criterion info
      doc.setTextColor(0, 0, 0);
      doc.text(`${criterion.id}: ${criterion.name}`, 25, yPosition);
      
      // Rank info
      if (rankInfo) {
        doc.setTextColor(30, 100, 30);
        doc.text(`Rank: ${rankInfo.rank}`, 160, yPosition);
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('Not ranked', 160, yPosition);
      }
      
      yPosition += 15;
    });
    
    // Step 2: Comparisons Section
    yPosition += 15;
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Step 2: Compare Adjacent Criteria', 20, yPosition);
    
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text('(How much more important each criterion is than the previous)', 20, yPosition + 7);
    
    yPosition += 20;
    
    // Draw comparisons
    doc.setFontSize(14);
    if (comparisons.length > 0) {
      comparisons.forEach((comp, index) => {
        // Draw background for alternating rows
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(20, yPosition - 7, 170, 12, 'F');
        }
        
        doc.setTextColor(0, 0, 0);
        doc.text(`${comp.criterion2.name}`, 25, yPosition);
        doc.setTextColor(80, 80, 80);
        doc.text('is', 70, yPosition);
        doc.setTextColor(0, 0, 150);
        doc.text(`${comp.importance}`, 80, yPosition);
        doc.setTextColor(80, 80, 80);
        doc.text('times more important than', 90, yPosition);
        doc.setTextColor(0, 0, 0);
        doc.text(`${comp.criterion1.name}`, 155, yPosition);
        
        yPosition += 15;
        
        // Add page break if needed
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text('No comparisons made', 25, yPosition);
    }
    
    // Footer with submission info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);
    doc.text(`Submission ID: ${submissionId}`, 20, 285);
    
    // Upload PDF to private storage
    const fileName = `criteria-weighing-${submissionId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('pdf-storage')
      .upload(fileName, doc.output('arraybuffer'), {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      // Still return success since we saved the data
      return res.status(200).json({ 
        success: true, 
        message: 'Data saved but PDF storage failed: ' + uploadError.message
      });
    }

    // Success
    return res.status(200).json({ 
      success: true, 
      message: 'Data saved successfully. PDF stored privately.'
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}