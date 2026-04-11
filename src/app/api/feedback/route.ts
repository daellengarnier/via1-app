import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const GITHUB_REPO = "daellengarnier/via1-app";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const body = (await request.json()) as {
    title: string;
    description: string;
    type: "idea" | "bug";
  };

  const { title, description, type } = body;

  if (!title || !type) {
    return NextResponse.json(
      { error: "Titel und Typ erforderlich." },
      { status: 400 }
    );
  }

  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return NextResponse.json(
      { error: "GitHub-Integration nicht konfiguriert." },
      { status: 500 }
    );
  }

  const label = type === "bug" ? "bug" : "idea";
  const emoji = type === "bug" ? "🐛" : "💡";

  const issueBody = [
    `${emoji} **${type === "bug" ? "Bug-Meldung" : "Idee"}** von **${session.user.name}**`,
    "",
    description || "_Keine weitere Beschreibung._",
    "",
    "---",
    `_Gemeldet über die via1-app von ${session.user.name} (${session.user.email})_`,
  ].join("\n");

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        title: `[${type === "bug" ? "Bug" : "Idee"}] ${title}`,
        body: issueBody,
        labels: [label],
      }),
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "GitHub Issue konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  const issue = (await response.json()) as { number: number; html_url: string };

  return NextResponse.json({
    success: true,
    issueNumber: issue.number,
    url: issue.html_url,
  });
}
