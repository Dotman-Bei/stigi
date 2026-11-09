export interface SelectionBarProps {
  count: number;
  canTeach: boolean;
  onMoreLikeThese: () => void;
  onClear: () => void;
}

export function SelectionBar({ count, canTeach, onMoreLikeThese, onClear }: SelectionBarProps) {
  if (count === 0) return null;
  return (
    <div className="stigi-selection" role="toolbar" aria-label="Selection">
      <span>{`${count} selected`}</span>
      <button type="button" className="stigi-btn stigi-btn--secondary" disabled={count < 2 || !canTeach} onClick={onMoreLikeThese}>
        More like these
      </button>
      <button type="button" className="stigi-link" onClick={onClear}>Clear</button>
    </div>
  );
}
