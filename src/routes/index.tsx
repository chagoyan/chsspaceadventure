import { createFileRoute } from "@tanstack/react-router";
import { Game } from "../components/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oscar's Git Space Adventure — Learn Git by Flying a Spaceship" },
      {
        name: "description",
        content:
          "Join Oscar the horned toad in a top-down arcade mission that teaches Git commands for tracking ship status, changes, and checkpoints.",
      },
      { property: "og:title", content: "Oscar's Git Space Adventure" },
      {
        property: "og:description",
        content: "Help Oscar fly, fight, and survive while using Git to track the ship's changes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});
