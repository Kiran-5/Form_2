import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase client with service role key (full access)
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
      return res.status(500).json({ error: 'Failed to save data' });
    }

    const submissionId = submissionData[0].id;

    // Generate PDF
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Laptop Selection Criteria Weighing', 10, 20);
    
    doc.setFontSize(16);
    doc.text('Ranked Criteria:', 10, 40);
    
    ranked_criteria.forEach((criterion, index) => {
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${criterion.name} (${criterion.id})`, 15, 50 + index * 10);
    });
    
    doc.setFontSize(16);
    doc.text('Comparisons:', 10, 100);
    
    comparisons.forEach((comp, index) => {
      const y = 110 + index * 15;
      doc.setFontSize(12);
      doc.text(`${comp.criterion2.name} is ${comp.importance} times more important than ${comp.criterion1.name}`, 15, y);
    });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, 280);
    doc.text(`Submission ID: ${submissionId}`, 10, 285);

    // Upload PDF to private storage (no public access)
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
        message: 'Data saved but PDF storage failed'
      });
    }

    // Success - no PDF access provided to frontend
    return res.status(200).json({ 
      success: true, 
      message: 'Data saved successfully. PDF stored privately.'
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}