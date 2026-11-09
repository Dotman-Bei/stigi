import { useState } from "react";

import { dailyLimitMessage } from "@shared/agent-limits";
import type { AgentUsage } from "@shared/board-types";
import { SAMPLE_LABEL } from "@shared/sample-feedback";

export interface BoardTopBarProps {
  totalNotes: number;
  themeCount: number;
  unsortedCount: number;
  sampleNotes: number;
  usage: AgentUsage | null;
  agentRunning: boolean;
  autoTeach: boolean;
  onAutoTeachChange: (value: boolean) => void;
  sorting: boolean;
  onSortToggle: (() => void) | null;
  onImportCsv: (() => void) | null;
  onOpenReport: (() => void) | null;
  onResetBoard: (() => void) | null;
}

export function BoardTopBar(props: BoardTopBarProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const outOfCredits = props.usage !== null && props.usage.remaining <= 0;
  const sortDisabled = !props.sorting && (outOfCredits || props.unsortedCount === 0 || props.agentRunning);
  return (
    <div className="stigi-topbar-wrap">
      <div className="stigi-topbar">
        <h1 className="stigi-topbar__title">
          <img className="stigi-topbar__mark" src="/stigi-mark.svg" alt="" aria-hidden="true" width={24} height={24} />
          Feedback board
        </h1>
        {props.sampleNotes > 0 ? <span className="stigi-chip">{SAMPLE_LABEL}</span> : null}
        <span className="stigi-meta">
          {`${props.totalNotes} notes · ${props.themeCount} themes · ${props.unsortedCount} unsorted`}
        </span>
        {props.usage ? (
          <span className="stigi-meta">{`${props.usage.remaining} of ${props.usage.limit} agent turns left today`}</span>
        ) : null}
        {props.agentRunning ? <span className="stigi-pill">Agent working…</span> : null}
        <div className="stigi-topbar__actions">
          <label className="stigi-switch">
            <input
              type="checkbox"
              role="switch"
              aria-label="Auto-teach"
              checked={props.autoTeach}
              onChange={(e) => props.onAutoTeachChange(e.target.checked)}
            />
            Auto-teach
          </label>
          {props.onImportCsv ? (
            <button type="button" className="stigi-btn stigi-btn--secondary" onClick={props.onImportCsv}>Import CSV</button>
          ) : null}
          {props.onSortToggle ? (
            <button type="button" className="stigi-btn stigi-btn--primary" disabled={sortDisabled} onClick={props.onSortToggle}>
              {props.sorting ? "Stop sorting" : "Sort with agent"}
            </button>
          ) : null}
          {props.onOpenReport ? (
            <button type="button" className="stigi-btn stigi-btn--secondary" onClick={props.onOpenReport}>Report</button>
          ) : null}
          {props.onResetBoard ? (
            <button
              type="button"
              className="stigi-btn stigi-btn--secondary"
              onClick={() => {
                if (!confirmReset) { setConfirmReset(true); return; }
                setConfirmReset(false);
                props.onResetBoard?.();
              }}
              onBlur={() => setConfirmReset(false)}
            >
              {confirmReset ? "Click again to reset" : "Reset board"}
            </button>
          ) : null}
        </div>
      </div>
      {outOfCredits && props.usage ? (
        <p role="status" className="stigi-banner">{dailyLimitMessage(props.usage.limit)}</p>
      ) : null}
    </div>
  );
}
