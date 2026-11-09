import { Outlet, type LinksFunction } from "react-router";

import { BoardPage } from "@/components/board/BoardPage";
import boardStylesHref from "@/styles/board.css?url";
import tokensHref from "@/styles/stigi-tokens.css?url";

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400..500&display=swap";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: FONTS_HREF },
  { rel: "stylesheet", href: tokensHref },
  { rel: "stylesheet", href: boardStylesHref },
];

export function meta() {
  return [{ title: "Feedback board · Stigi" }];
}

export default function BoardRoute() {
  return (
    <div className="stigi-route">
      <BoardPage />
      <Outlet />
    </div>
  );
}
