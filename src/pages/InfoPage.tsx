import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  HeartHandshake,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { TwoColumnLayout } from "@/components/layout/TwoColumnLayout";
import { Card } from "@/components/ui";
import { NotFoundPage } from "@/pages/NotFoundPage";

const pages = {
  "how-it-works": {
    eyebrow: "A neighborhood habit",
    title: "Good things find their way back.",
    description:
      "A clear listing and a kind message are often all it takes to bring a lost thing home.",
    intro:
      "Common Ground brings nearby lost and found listings into one calm, searchable place. You can look around without an account, and contact a poster privately when something seems familiar.",
    steps: [
      [
        "01",
        "Search nearby",
        "Browse recent listings or search by an item, place, or detail you remember.",
      ],
      [
        "02",
        "Share what you know",
        "Post a lost or found item with a useful description and a nearby landmark.",
      ],
      [
        "03",
        "Make a safe connection",
        "Send a private note with a detail that helps confirm the match. Arrange a public handoff.",
      ],
    ],
    sidebarTitle: "A little care goes a long way",
    sidebarBody:
      "Keep serial numbers, full addresses, and identifying details private until you’re sure you’re speaking with the right person.",
    icon: <HeartHandshake size={18} />,
  },
  contact: {
    eyebrow: "We're neighbors, too",
    title: "Start with the person who posted.",
    description:
      "The quickest way to ask about an item is to open its listing and send a private note.",
    intro:
      "Common Ground is a community noticeboard. For a listing question, use the contact button on that item’s page. If something feels unsafe or a listing needs attention, share the listing details with a trusted community organizer.",
    steps: [
      [
        "01",
        "Open the listing",
        "Choose the item you’re asking about so your note has the right context.",
      ],
      [
        "02",
        "Send a private note",
        "Use the claim or found-item action and share only the details needed to identify the item.",
      ],
      [
        "03",
        "Choose a public handoff",
        "Agree on a staffed or well-known public place. Bring someone along if that feels safer.",
      ],
    ],
    sidebarTitle: "A note about this preview",
    sidebarBody:
      "This community preview has no staffed support inbox. For a listing, contact its poster directly; for an immediate safety concern, contact local authorities.",
    icon: <Mail size={18} />,
  },
  privacy: {
    eyebrow: "Your details belong to you",
    title: "Privacy, kept practical.",
    description:
      "Share enough to make a connection. Keep the details that identify you or your belongings to yourself.",
    intro:
      "Listings are visible to people using the noticeboard. Use a first name, a general location, and a description that helps someone recognize an item without giving away sensitive information.",
    steps: [
      [
        "01",
        "Keep personal details out",
        "Do not post home addresses, phone numbers, account numbers, or identifying documents.",
      ],
      [
        "02",
        "Verify before you meet",
        "Ask the other person to describe a detail not shown in the public listing.",
      ],
      [
        "03",
        "Choose what you share",
        "Use the private claim form for contact details and share only what’s needed to arrange a return.",
      ],
    ],
    sidebarTitle: "Safer exchanges",
    sidebarBody:
      "Meet during daylight in a public place. Do not share verification codes, passwords, or payment details to recover an item.",
    icon: <ShieldCheck size={18} />,
  },
  guidelines: {
    eyebrow: "A kind, useful board",
    title: "A few good-neighbor guidelines.",
    description:
      "The best listings are specific enough to help, and considerate enough to protect everyone.",
    intro:
      "Common Ground works when people feel safe asking for help and returning things. Keep listings accurate, messages respectful, and handoffs thoughtful.",
    steps: [
      [
        "01",
        "Describe the item honestly",
        "Use a clear title, the general area, and a detail that helps its owner recognize it.",
      ],
      [
        "02",
        "Keep one-of-a-kind clues private",
        "Leave out names, serial numbers, exact addresses, and anything that could invite a false claim.",
      ],
      [
        "03",
        "Be considerate in messages",
        "Respond kindly, meet in public, and never ask for money or sensitive information as proof of ownership.",
      ],
    ],
    sidebarTitle: "If something feels off",
    sidebarBody:
      "Pause the conversation and do not meet alone. Use a public place, involve someone you trust, and contact local authorities for immediate safety concerns.",
    icon: <BookOpenCheck size={18} />,
  },
  faq: {
    eyebrow: "A few common questions",
    title: "The small things, answered.",
    description:
      "A clear, practical answer for the moments between finding a listing and finding your thing.",
    intro:
      "You can browse without creating an account. When you send a claim, include a detail the poster can use to confirm you’re the owner. Never include a password, verification code, or financial information.",
    steps: [
      ["Can I browse without signing in?", "Yes. Browse and search listings without an account."],
      [
        "What should I put in a claim?",
        "Share one private identifying detail and a way the poster can reply. Leave sensitive information out.",
      ],
      [
        "Where should we meet?",
        "Choose a public, familiar place during daylight. Avoid sharing your home address.",
      ],
    ],
    sidebarTitle: "Still have a question?",
    sidebarBody:
      "Open the listing and contact its poster privately. For general guidance, read our safety and privacy notes.",
    icon: <BookOpenCheck size={18} />,
  },
} as const;

export function InfoPage() {
  const { pathname } = useLocation();
  const topic = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const page = pages[topic as keyof typeof pages];

  if (!page) return <NotFoundPage />;

  return (
    <PageContainer className="info-page">
      <Link className="back-link info-back-link" to="/">
        <ArrowLeft size={15} /> Back to the noticeboard
      </Link>
      <PageHeader eyebrow={page.eyebrow} title={page.title} description={page.description} />
      <TwoColumnLayout
        className="info-layout"
        sidebarLabel={page.sidebarTitle}
        sidebar={
          <Card className="info-sidebar-card">
            <span className="info-sidebar-icon">{page.icon}</span>
            <h2>{page.sidebarTitle}</h2>
            <p>{page.sidebarBody}</p>
            <Link className="text-link" to="/guidelines">
              Read our guidelines <ArrowRight size={14} />
            </Link>
          </Card>
        }
      >
        <p className="info-intro">{page.intro}</p>
        <div className="info-steps">
          {page.steps.map(([title, detail], index) => (
            <article className="info-step" key={title}>
              <span className="info-step-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{title}</h2>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="info-page-actions">
          <Link className="button button-dark" to="/items">
            Browse the noticeboard <ArrowRight size={15} />
          </Link>
          {topic !== "contact" && (
            <Link className="text-link" to="/contact">
              Need to get in touch? <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </TwoColumnLayout>
    </PageContainer>
  );
}
