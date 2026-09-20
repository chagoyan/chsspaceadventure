import { createFileRoute } from "@tanstack/react-router";
import { Game } from "../components/Game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Git Space Adventure — Learn Git by Flying a Spaceship" },
      {
        name: "description",
        content:
          "A pixel-art top-down arcade game that teaches real Git commands — init, status, add, commit, log, reset, revert — through a space mission. For high-school beginners.",
      },
      { property: "og:title", content: "Git Space Adventure" },
      {
        property: "og:description",
        content: "Fly, fight, and survive a space mission while learning real Git commands.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});
