import { NextResponse } from "next/server";

// This will be manually maintained
// Later you can create a JSON file to manage this data
const extensions = [
  {
    id: "sillysimtracker",
    name: "SimTracker",
    description:
      "Customize your RPs with statistics, all the way from dating, RPGs, and more! The possibilties are endless.",
    repoUrl: "https://github.com/prolix-oc/SillyTavern-SimTracker",
    thumbnail: "/simtracker.png",
    category: "prolix",
  },
    {
    id: "lumiversehelper",
    name: "LumiverseHelper",
    description:
      "Unleash the full potential of Lucid Loom, get automated summaries, and customize your Lumia. All with Lucid.cards integration.",
    repoUrl: "https://github.com/prolix-oc/SillyTavern-LumiverseHelper",
    thumbnail: "/lumiverse.png",
    category: "prolix",
  },
  {
    id: "sillyrpc",
    name: "SillyRPC",
    description:
      "Sync your RP status with Discord! Requires the Server and Agent as well, available from my GitHub.",
    repoUrl: "https://github.com/prolix-oc/SillyRPC",
    thumbnail: "/sillyrpc.png",
    category: "prolix",
  },
  {
    id: "nemopresetext",
    name: "NemoPresetExt",
    description:
      "A plethora of prompt management, lore, and formatting tools made by the creator of NemoEngine.",
    repoUrl: "https://github.com/NemoVonNirgend/NemoPresetExt",
    thumbnail: "/nemopresetext.png",
    category: "recommended",
  },
  {
    id: "bunnymo",
    name: "BunnyMo",
    description:
      "A preset in a world book, allows for creating character sheets and enforcing language guidelines with plenty of quirks and packs!",
    repoUrl: "https://github.com/Coneja-Chibi/BunnyMo",
    thumbnail: "/bunnymo.png",
    category: "recommended",
  },
  {
    id: "landingpage",
    name: "Landing Page",
    description:
      "A pretty, fun and cool way to show your character cards AND have quick access to them!",
    repoUrl: "https://github.com/LenAnderson/SillyTavern-LandingPage",
    thumbnail: "/landingpage.jpg",
    category: "recommended",
  },
];

export async function GET() {
  try {
    return NextResponse.json(
      {
        success: true,
        extensions,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching extensions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch extensions" },
      { status: 500 }
    );
  }
}
