import { HyperCardAppComponent } from "./components/HyperCardAppComponent";
import type { BaseApp } from "../base/types";

export const helpItems = [
  {
    icon: "🃏",
    title: "Cards and Stacks",
    description:
      "HyperCard uses cards as its basic unit of organization. Cards are grouped into stacks that you can save and share.",
  },
  {
    icon: "🔧",
    title: "Tools",
    description:
      "Use the tools palette to create buttons, fields, and draw on cards. Switch between browse and edit modes to interact with or modify your cards.",
  },
  {
    icon: "📝",
    title: "Objects",
    description:
      "Create buttons, text fields, and other objects on your cards. Use the properties inspector to modify their appearance and behavior.",
  },
  {
    icon: "🎨",
    title: "Drawing",
    description:
      "Use the drawing tools to create graphics on your cards. All drawing is bitmap-based, perfect for pixel art and classic Mac-style graphics.",
  },
  {
    icon: "💾",
    title: "Saving",
    description:
      "Save your stacks to create reusable collections of cards. Stacks can be shared and opened by other users.",
  },
  {
    icon: "📜",
    title: "Scripting",
    description:
      "Add interactivity to your cards using a simplified version of HyperTalk. Create buttons that navigate between cards or perform actions.",
  },
];

export const appMetadata = {
  name: "HyperCard",
  version: "1.0.0",
  creator: {
    name: "Ryo Lu",
    url: "https://github.com/ryokun6",
  },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/hypercard.png", // Note: We'll need to create this icon
};

export const HyperCardApp: BaseApp = {
  id: "hypercard",
  name: "HyperCard",
  icon: { type: "image", src: "/icons/hypercard.png" }, // Note: We'll need to create this icon
  description: "Classic HyperCard-style card and stack application",
  component: HyperCardAppComponent,
  helpItems,
  metadata: appMetadata,
}; 