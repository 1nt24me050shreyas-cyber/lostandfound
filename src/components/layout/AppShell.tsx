import { useEffect, useRef } from "react";
import { ArrowUpRight, CircleUserRound, Monitor, Moon, Sun } from "lucide-react";
import { Link, NavLink, Outlet, ScrollRestoration } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import type { ThemePreference } from "@/app/theme-types";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { SiteSearch } from "@/components/layout/SiteSearch";

const primaryLinks = [
  { to: "/items", label: "Browse" },
  { to: "/report/lost", label: "Report lost" },
  { to: "/report/found", label: "Report found" },
  { to: "/how-it-works", label: "How it works" },
];

export function AppShell() {
  const { preference, setTheme } = useTheme();
  const accountRef = useRef<HTMLDetailsElement>(null);
  const nextTheme: ThemePreference =
    preference === "system" ? "dark" : preference === "dark" ? "light" : "system";

  useEffect(() => {
    function closeAccountMenu(event: PointerEvent) {
      if (event.target instanceof Node && !accountRef.current?.contains(event.target)) {
        accountRef.current?.removeAttribute("open");
      }
    }

    document.addEventListener("pointerdown", closeAccountMenu);
    return () => document.removeEventListener("pointerdown", closeAccountMenu);
  }, []);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Common Ground home">
            <span className="brand-wordmark">
              common<span>ground</span>
            </span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            {primaryLinks.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-tools">
            <SiteSearch />
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme(nextTheme)}
              aria-label={`Switch to ${nextTheme} theme`}
              title={`Theme: ${preference}. Activate to switch to ${nextTheme}.`}
            >
              {preference === "dark" ? (
                <Sun size={17} />
              ) : preference === "light" ? (
                <Moon size={17} />
              ) : (
                <Monitor size={17} />
              )}
            </button>
            <details
              className="account-menu"
              ref={accountRef}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector("summary")?.focus();
                }
              }}
            >
              <summary aria-label="Open guest account menu">
                <CircleUserRound size={19} aria-hidden="true" />
                <span>Account</span>
              </summary>
              <div className="account-popover">
                <p className="account-overline">YOUR ACCOUNT</p>
                <strong>Browsing as a guest</strong>
                <p>You can browse and send a claim without creating an account.</p>
                <Link to="/faq" onClick={() => accountRef.current?.removeAttribute("open")}>
                  How claims work <ArrowUpRight size={14} />
                </Link>
                <Link to="/contact" onClick={() => accountRef.current?.removeAttribute("open")}>
                  Contact &amp; support <ArrowUpRight size={14} />
                </Link>
              </div>
            </details>
          </div>
          <div className="mobile-header-tools">
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme(nextTheme)}
              aria-label={`Switch to ${nextTheme} theme`}
            >
              {preference === "dark" ? (
                <Sun size={17} />
              ) : preference === "light" ? (
                <Moon size={17} />
              ) : (
                <Monitor size={17} />
              )}
            </button>
            <MobileNavigation />
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand-block">
            <Link className="brand footer-brand" to="/">
              <span className="brand-wordmark">
                common<span>ground</span>
              </span>
            </Link>
            <p>Good things find their way back.</p>
          </div>
          <div className="footer-link-group">
            <span>THE NOTICEBOARD</span>
            <Link to="/items">Browse items</Link>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/report/found">Report a find</Link>
          </div>
          <div className="footer-link-group">
            <span>HERE TO HELP</span>
            <Link to="/contact">Contact</Link>
            <Link to="/faq">Frequently asked questions</Link>
            <Link to="/guidelines">Community guidelines</Link>
            <Link to="/privacy">Privacy &amp; safety</Link>
          </div>
          <p className="footer-note">A neighborhood lost &amp; found · Est. 2024</p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
