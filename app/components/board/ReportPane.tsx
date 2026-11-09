import { useAgentChatGenerating } from "@agent-native/core/client/agent-chat";
import { actionErrorMessage, useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { dailyLimitMessage } from "@shared/agent-limits";

import { buildReportHandoff } from "@/lib/board/handoff";
import { downloadMarkdown, reportFileName } from "@/lib/board/report-export";

export function ReportPane() {
  const navigate = useNavigate();
  const [isGenerating, sendToAgent] = useAgentChatGenerating();
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [agentVersion, setAgentVersion] = useState<string | null>(null);
  const lastServerRef = useRef<string | null>(null);
  const reportQuery = useActionQuery("get-report", {}, { refetchInterval: isGenerating ? 2_000 : false });
  const usageQuery = useActionQuery("get-agent-usage", {});
  const saveReport = useActionMutation("save-report", {
    onError: (error) => toast.error(actionErrorMessage(error)),
    onSuccess: () => {
      setDirty(false);
      toast.success("Report saved.");
    },
  });
  const report = reportQuery.data;
  const remaining = usageQuery.data?.remaining ?? 1;

  // Load the server version whenever the user has no unsaved edits (the editor stays disabled until the
  // first load, so nothing typed is lost); otherwise offer the agent's new version instead of overwriting.
  useEffect(() => {
    if (!report) return;
    if (lastServerRef.current === report.markdown) return;
    lastServerRef.current = report.markdown;
    if (!dirty) {
      setDraft(report.markdown);
      setAgentVersion(null);
      return;
    }
    if (report.updatedBy === "agent") setAgentVersion(report.markdown);
  }, [report, dirty]);

  async function writeWithAgent(): Promise<void> {
    const latest = (await usageQuery.refetch()).data;
    if (latest && latest.remaining <= 0) {
      toast.error(dailyLimitMessage(latest.limit));
      return;
    }
    const handoff = buildReportHandoff();
    sendToAgent({ message: handoff.message, context: handoff.context, submit: true, openSidebar: true });
  }

  return (
    <aside className="stigi-report" aria-label="Insight report" data-testid="report-pane">
      <div className="stigi-report__header">
        <h2>Insight report</h2>
        <button type="button" className="stigi-btn stigi-btn--secondary" onClick={() => navigate("/board")}>Close</button>
      </div>
      {agentVersion !== null ? (
        <p className="stigi-report__notice">
          The agent updated the report ·{" "}
          <button
            type="button"
            className="stigi-link"
            onClick={() => {
              setDraft(agentVersion);
              setDirty(false);
              setAgentVersion(null);
            }}
          >
            Load agent version
          </button>
        </p>
      ) : null}
      <textarea
        className="stigi-report__editor"
        aria-label="Report markdown"
        value={draft}
        disabled={reportQuery.isPending}
        placeholder="Ask the agent to write the report, or start typing Markdown."
        onChange={(e) => {
          setDraft(e.target.value);
          setDirty(true);
        }}
      />
      <div className="stigi-report__actions">
        <button type="button" className="stigi-btn stigi-btn--primary" disabled={!dirty || saveReport.isPending}
          onClick={() => saveReport.mutate({ markdown: draft })}>
          Save
        </button>
        <button type="button" className="stigi-btn stigi-btn--secondary" disabled={isGenerating || remaining <= 0}
          onClick={() => void writeWithAgent()}>
          {isGenerating ? "Agent writing…" : "Write with agent"}
        </button>
        <button type="button" className="stigi-btn stigi-btn--secondary" disabled={draft.trim().length === 0}
          onClick={() => downloadMarkdown(draft, reportFileName(new Date()))}>
          Export .md
        </button>
      </div>
    </aside>
  );
}
