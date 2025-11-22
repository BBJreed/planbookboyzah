import React from 'react';
import { useStore } from '../stores/appStore';

const Controls: React.FC = () => {
  const { setViewMode, setCover, setFont, setColor } = useStore();

  return (
    <div className="controls" style={{ display: 'flex', gap: '10px', margin: '10px 0', flexWrap: 'wrap' }}>
      <button 
        onClick={() => setViewMode('monthly')}
        style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: '#f5f5f5' }}
      >
        Monthly
      </button>
      <button 
        onClick={() => setViewMode('weekly')}
        style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: '#f5f5f5' }}
      >
        Weekly
      </button>
      <button 
        onClick={() => setViewMode('daily')}
        style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: '#f5f5f5' }}
      >
        Daily
      </button>
      
      <select 
        onChange={(e) => setCover(e.target.value)}
        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      >
        <option value="brown-leather">Brown Leather</option>
        <option value="floral">Floral</option>
      </select>
      
      <select 
        onChange={(e) => setFont(e.target.value)}
        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      >
        <option value="Arial, sans-serif">Modern</option>
        <option value="cursive">Cursive</option>
      </select>
      
      <input 
        type="color" 
        onChange={(e) => setColor(e.target.value)} 
        style={{ width: '40px', height: '40px', border: '1px solid #ccc', borderRadius: '4px' }}
      />
    </div>
  );
};

export default Controls;