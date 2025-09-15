import { useState, useEffect } from 'react';

export default function CriteriaWeighing() {
  const [criteria, setCriteria] = useState([
    { id: 'C-1', name: 'Performance', rank: null },
    { id: 'C-2', name: 'Battery Life', rank: null },
    { id: 'C-3', name: 'Display Quality', rank: null },
    { id: 'C-4', name: 'Portability', rank: null },
    { id: 'C-5', name: 'Price', rank: null }
  ]);

  const [rankedCriteria, setRankedCriteria] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [currentComparison, setCurrentComparison] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (rankedCriteria.length === 5) {
      const newComparisons = [];
      for (let i = 1; i < rankedCriteria.length; i++) {
        newComparisons.push({
          criterion1: rankedCriteria[i-1],
          criterion2: rankedCriteria[i],
          importance: 1
        });
      }
      setComparisons(newComparisons);
    }
  }, [rankedCriteria]);

  const handleRankChange = (criterionId, rank) => {
    const updatedCriteria = criteria.map(c => 
      c.id === criterionId ? { ...c, rank } : c
    );
    setCriteria(updatedCriteria);
  };

  const handleSaveRanks = () => {
    const ranked = [...criteria]
      .filter(c => c.rank !== null)
      .sort((a, b) => a.rank - b.rank);
    
    if (ranked.length === 5) {
      setRankedCriteria(ranked);
    } else {
      alert('Please rank all criteria');
    }
  };

  const handleImportanceChange = (index, value) => {
    const updatedComparisons = [...comparisons];
    updatedComparisons[index].importance = parseInt(value);
    setComparisons(updatedComparisons);
  };

  const handleNextComparison = () => {
    if (currentComparison < comparisons.length - 1) {
      setCurrentComparison(currentComparison + 1);
    }
  };

  const handlePreviousComparison = () => {
    if (currentComparison > 0) {
      setCurrentComparison(currentComparison - 1);
    }
  };

  const handleSubmit = async () => {
    const lastComparison = [...comparisons];
    lastComparison[currentComparison].importance = parseInt(document.getElementById('importance-scale').value);

    try {
      const response = await fetch('/api/save-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ranked_criteria: rankedCriteria,
          comparisons: lastComparison
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setIsSubmitted(true);
      } else {
        console.error('Server error:', result);
        alert(`Failed to save: ${result.error}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert(`Failed to save data. Network error: ${error.message}`);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Submission Complete!</h1>
            <p className="text-gray-600 mb-8">Your criteria weighing has been saved securely.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Laptop Selection Criteria Weighing</h1>
          <p className="text-gray-600">Rank and weigh criteria for optimal laptop selection</p>
        </header>

        {!rankedCriteria.length ? (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Step 1: Rank Criteria by Importance</h2>
            <div className="space-y-4">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-indigo-600 font-bold">{criterion.id}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{criterion.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Rank:</label>
                    <select 
                      value={criterion.rank || ''}
                      onChange={(e) => handleRankChange(criterion.id, parseInt(e.target.value))}
                      className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button 
                onClick={handleSaveRanks}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Save Rankings and Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Step 2: Compare Adjacent Criteria</h2>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Ranked Criteria (Most to Least Important):</h3>
              <div className="flex flex-wrap gap-2">
                {rankedCriteria.map((criterion, index) => (
                  <span key={criterion.id} className="bg-white px-3 py-1 rounded-full text-sm border">
                    {index + 1}. {criterion.name}
                  </span>
                ))}
              </div>
            </div>

            {comparisons.length > 0 && (
              <div className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      Comparison {currentComparison + 1} of {comparisons.length}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {currentComparison + 1}/{comparisons.length}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-center mb-4">
                      <div className="text-xl font-semibold text-indigo-600">
                        {comparisons[currentComparison].criterion2.name}
                      </div>
                      <p className="text-gray-600">is ______ times more important than</p>
                      <div className="text-xl font-semibold text-gray-800">
                        {comparisons[currentComparison].criterion1.name}
                      </div>
                    </div>
                    
                    <div className="max-w-md mx-auto">
                      <label htmlFor="importance-scale" className="block text-sm font-medium text-gray-700 mb-2">
                        How many times more important?
                      </label>
                      <select
                        id="importance-scale"
                        defaultValue={comparisons[currentComparison].importance}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                      <div className="mt-2 text-sm text-gray-500">
                        Scale: 1 (equally important) to 9 (extremely more important)
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={handlePreviousComparison}
                      disabled={currentComparison === 0}
                      className={`px-4 py-2 rounded-lg ${
                        currentComparison === 0 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Previous
                    </button>
                    {currentComparison < comparisons.length - 1 ? (
                      <button
                        onClick={handleNextComparison}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Submit All
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}