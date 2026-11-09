import { ReportPane } from "@/components/board/ReportPane";

export function meta() {
  return [{ title: "Insight report · Stigi" }];
}

export default function BoardReportRoute() {
  return <ReportPane />;
}
