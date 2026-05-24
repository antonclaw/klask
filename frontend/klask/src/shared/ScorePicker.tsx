import React from 'react';

type ScorePickerProps = {
  max: number;
  value: number | null;
  onSelect: (value: number) => void;
  asButton?: boolean;
};

export default function ScorePicker({ max, value, onSelect, asButton = false }: ScorePickerProps) {
  return (
    <div className="score-row">
      {Array.from({ length: max + 1 }, (_, score) => {
        const className = `score-circle${value === score ? ' active' : ''}`;
        return asButton ? (
          <button key={score} className={className} onClick={() => onSelect(score)}>
            {score}
          </button>
        ) : (
          <div key={score} className={className} onClick={() => onSelect(score)}>
            {score}
          </div>
        );
      })}
    </div>
  );
}
