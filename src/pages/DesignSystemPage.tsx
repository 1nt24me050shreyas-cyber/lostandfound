import { useState } from "react";
import { ArrowUpRight, CircleHelp, FileSearch, ShieldCheck } from "lucide-react";
import {
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Dialog,
  EmptyState,
  Input,
  Pagination,
  Radio,
  Select,
  Skeleton,
  Tabs,
  Textarea,
  Tooltip,
} from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import type { ThemePreference } from "@/app/theme-types";

const categories = [
  { value: "bags", label: "Bags" },
  { value: "clothing", label: "Clothing" },
  { value: "electronics", label: "Electronics" },
];

function ThemeShowcase({ theme }: { theme: "light" | "dark" }) {
  const [page, setPage] = useState(2);
  const notify = useToast();
  const pageItems = [
    {
      value: "overview",
      label: "Overview",
      content: (
        <p className="ds-tab-copy">
          The little details matter. Components keep familiar patterns clear and consistent.
        </p>
      ),
    },
    {
      value: "accessibility",
      label: "Accessibility",
      content: (
        <p className="ds-tab-copy">
          Keyboard navigation, visible focus, and helpful names are part of the component—not
          extras.
        </p>
      ),
    },
  ];

  return (
    <section
      className="ds-theme-panel"
      data-theme={theme}
      aria-labelledby={`theme-${theme}-heading`}
    >
      <header className="ds-theme-header">
        <div>
          <p className="eyebrow">
            {theme === "light" ? "Warm paper, daylight" : "Quiet contrast, evening"}
          </p>
          <h2 id={`theme-${theme}-heading`}>{theme === "light" ? "Light theme" : "Dark theme"}</h2>
        </div>
        <span className="ds-theme-chip">{theme}</span>
      </header>

      <section className="ds-section">
        <h3>Color tokens</h3>
        <div className="ds-token-grid">
          {[
            ["Background", "var(--background)"],
            ["Surface", "var(--surface)"],
            ["Border", "var(--border)"],
            ["Text", "var(--text)"],
            ["Muted", "var(--muted)"],
            ["Accent", "var(--accent)"],
            ["Lost", "var(--lost)"],
            ["Found", "var(--found)"],
            ["Danger", "var(--danger)"],
            ["Focus ring", "var(--focus-ring)"],
          ].map(([label, color]) => (
            <div className="ds-token" key={label}>
              <span className="ds-token-swatch" style={{ backgroundColor: color }} />
              <span>
                <strong>{label}</strong>
                <code>{color}</code>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-section">
        <h3>Typography</h3>
        <div className="ds-type-samples">
          <h1 className="ds-type-display">A small thing, found.</h1>
          <h2 className="ds-type-heading">The neighborhood noticeboard</h2>
          <p className="ds-type-body">
            Public Sans keeps the everyday details easy to read. Source Serif gives the important
            moments a little room.
          </p>
          <p className="ds-type-caption">REPORTED NEAR NORTHSIDE LIBRARY · OCT 28</p>
        </div>
      </section>

      <section className="ds-section">
        <h3>Buttons</h3>
        <div className="ds-component-row">
          <Button>
            Primary action <ArrowUpRight size={15} />
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost button</Button>
          <Button variant="danger">Remove listing</Button>
        </div>
        <div className="ds-component-row">
          <Button size="sm">Small</Button>
          <Button size="md">Default</Button>
          <Button size="lg">Large</Button>
          <Button loading>Saving changes</Button>
          <Button disabled>Unavailable</Button>
          <Button variant="secondary" className="ds-focus-demo">
            Focus ring
          </Button>
        </div>
        <p className="ds-hint">
          Hover the buttons, or tab through the controls to see keyboard focus.
        </p>
      </section>

      <section className="ds-section">
        <h3>Form controls</h3>
        <div className="ds-form-grid">
          <label className="ds-field" htmlFor={`${theme}-input`}>
            <span>Item name</span>
            <Input id={`${theme}-input`} placeholder="e.g. Blue umbrella" />
          </label>
          <label className="ds-field" htmlFor={`${theme}-disabled-input`}>
            <span>Disabled field</span>
            <Input id={`${theme}-disabled-input`} placeholder="Unavailable" disabled />
          </label>
          <label className="ds-field" htmlFor={`${theme}-select`}>
            <span>Category</span>
            <Select
              id={`${theme}-select`}
              aria-label="Category"
              placeholder="Choose a category"
              options={categories}
              theme={theme}
            />
          </label>
          <label className="ds-field" htmlFor={`${theme}-date`}>
            <span>Date last seen</span>
            <DatePicker id={`${theme}-date`} />
          </label>
          <label className="ds-field" htmlFor={`${theme}-invalid`}>
            <span>
              Email address <b>· Error state</b>
            </span>
            <Input
              id={`${theme}-invalid`}
              type="email"
              placeholder="you@example.com"
              error="Enter a valid email address."
            />
          </label>
          <label className="ds-field ds-field-wide" htmlFor={`${theme}-textarea`}>
            <span>Helpful details</span>
            <Textarea
              id={`${theme}-textarea`}
              rows={3}
              placeholder="A detail that might help someone recognize it"
            />
          </label>
          <label className="ds-field ds-field-wide" htmlFor={`${theme}-textarea-error`}>
            <span>Details · Error state</span>
            <Textarea
              id={`${theme}-textarea-error`}
              rows={2}
              error="Add a little more detail before continuing."
              defaultValue="Blue and grey."
            />
          </label>
        </div>
        <div className="ds-choice-grid">
          <fieldset className="ds-fieldset">
            <legend>Preferences</legend>
            <Checkbox
              id={`${theme}-updates`}
              label="Email me when someone replies"
              defaultChecked
            />
            <Checkbox id={`${theme}-disabled-check`} label="Unavailable option" disabled />
          </fieldset>
          <fieldset className="ds-fieldset">
            <legend>Listing type</legend>
            <Radio
              name={`${theme}-status`}
              defaultValue="lost"
              options={[
                { value: "lost", label: "Lost item" },
                { value: "found", label: "Found item" },
                { value: "disabled", label: "Unavailable", disabled: true },
              ]}
            />
          </fieldset>
        </div>
      </section>

      <section className="ds-section">
        <h3>Badges &amp; identity</h3>
        <div className="ds-component-row">
          <Badge status="lost" />
          <Badge status="found" />
          <Badge status="claimed" />
          <Badge status="returned" />
        </div>
        <div className="ds-component-row ds-avatar-row">
          <Avatar name="Mara Lee" size="sm" />
          <Avatar name="Theo Martin" size="md" />
          <Avatar name="Nina Patel" size="lg" />
          <span className="ds-avatar-name">Neighbors who look out for one another.</span>
        </div>
      </section>

      <section className="ds-section">
        <h3>Surface, tabs &amp; navigation</h3>
        <Card className="ds-card">
          <div className="ds-card-heading">
            <span className="eyebrow">FOUND · BAGS</span>
            <Tooltip content="A neighbor shared this listing today." theme={theme}>
              <button className="ui-icon-button" type="button" aria-label="About this listing">
                <CircleHelp size={17} />
              </button>
            </Tooltip>
          </div>
          <h4>A canvas tote, left at the library</h4>
          <p>Handed in at the front desk, with a red paperback tucked inside.</p>
          <div className="ds-card-bottom">
            <span>Northside Library</span>
            <Button variant="ghost" size="sm">
              View listing <ArrowUpRight size={14} />
            </Button>
          </div>
        </Card>
        <Tabs items={pageItems} defaultValue="overview" />
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Items", href: "/items" },
            { label: "Canvas tote" },
          ]}
        />
      </section>

      <section className="ds-section">
        <h3>Dialog, toast &amp; feedback</h3>
        <div className="ds-component-row">
          <Dialog
            trigger={<Button variant="secondary">Open dialog</Button>}
            title="A private note"
            description="Your contact details are only shared with the person who posted this listing."
            theme={theme}
          >
            <p className="ds-dialog-copy">
              A few details can help confirm you’ve found the right item.
            </p>
            <Button
              onClick={() =>
                notify({
                  title: "Note ready to send",
                  description: "This is a design preview.",
                  kind: "success",
                  theme,
                })
              }
            >
              Continue
            </Button>
          </Dialog>
          <Button
            variant="secondary"
            onClick={() =>
              notify({
                title: "Your listing is saved",
                description: "It’s now on the neighborhood board.",
                kind: "success",
                theme,
              })
            }
          >
            Show success toast
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              notify({
                title: "One more detail needed",
                description: "Check the highlighted field and try again.",
                kind: "danger",
                theme,
              })
            }
          >
            Show alert toast
          </Button>
        </div>
        <div className="ds-feedback-grid">
          <div>
            <p className="ds-sub-label">Loading content</p>
            <div className="ds-skeleton-card">
              <Skeleton className="ds-skeleton-avatar" />
              <span>
                <Skeleton className="ds-skeleton-line" />
                <Skeleton className="ds-skeleton-line ds-skeleton-short" />
              </span>
            </div>
          </div>
          <div>
            <p className="ds-sub-label">Nothing found</p>
            <EmptyState
              icon={<FileSearch size={22} />}
              title="No matching items"
              description="Try a different detail or clear the filters."
              action={
                <Button variant="secondary" size="sm">
                  Clear filters
                </Button>
              }
            />
          </div>
        </div>
      </section>

      <section className="ds-section ds-last-section">
        <h3>Pagination</h3>
        <p className="ds-hint">Showing 21–40 of 86 listings</p>
        <Pagination page={page} pageCount={5} onPageChange={setPage} />
      </section>

      <div className="ds-screen-reader-note">
        <ShieldCheck size={16} /> Radix primitives provide keyboard navigation, focus management,
        and screen-reader semantics.
      </div>
    </section>
  );
}

export function DesignSystemPage() {
  const { preference, setTheme } = useTheme();
  const options: ThemePreference[] = ["system", "light", "dark"];

  return (
    <div className="design-system-page page-wrap">
      <div className="ds-page-heading">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Common Ground · UI library
          </p>
          <h1>
            Made for finding <em>your way.</em>
          </h1>
          <p className="ds-lede">
            A working guide to the patterns behind the neighborhood noticeboard. Built for real
            hands, real screens, and the moments in between.
          </p>
        </div>
        <label className="ds-theme-control">
          <span>Site theme</span>
          <select
            value={preference}
            onChange={(event) => {
              const nextPreference = options.find((option) => option === event.target.value);
              if (nextPreference) setTheme(nextPreference);
            }}
            aria-label="Site theme"
          >
            {options.map((option) => (
              <option value={option} key={option}>
                {option[0].toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ds-theme-columns">
        <ThemeShowcase theme="light" />
        <ThemeShowcase theme="dark" />
      </div>
    </div>
  );
}
