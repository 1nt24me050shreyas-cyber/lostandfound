import { useEffect, useRef } from "react";
import { ArrowUpRight, CircleUserRound } from "lucide-react";
import { Link, NavLink, Outlet, ScrollRestoration } from "react-router-dom";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { SiteSearch } from "@/components/layout/SiteSearch";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const primaryLinks = [
  { to: "/items", label: "Browse" },
  { to: "/report/lost", label: "Report lost" },
  { to: "/report/found", label: "Report found" },
  { to: "/how-it-works", label: "How it works" },
];

export function AppShell() {
  const { user, signOut } = useAuth();
  const accountRef = useRef<HTMLDetailsElement>(null);

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
            <NotificationCenter />
            <ThemeToggle />
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
              <summary aria-label="Open account menu">
                <CircleUserRound size={19} aria-hidden="true" />
                <span>{user ? "My account" : "Account"}</span>
              </summary>
              <div className="account-popover">
                <p className="account-overline">YOUR ACCOUNT</p>
                {user ? (
                  <>
                    <strong>Hello, {user.name.split(" ")[0]}</strong>
                    <p>Manage your reports, claims, and settings.</p>
                    <Link to="/account" onClick={() => accountRef.current?.removeAttribute("open")}>
                      Go to your account <ArrowUpRight size={14} />
                    </Link>
                    {user.role === "admin" && (
                      <Link to="/admin" onClick={() => accountRef.current?.removeAttribute("open")}>
                        Admin console <ArrowUpRight size={14} />
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        accountRef.current?.removeAttribute("open");
                      }}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <strong>Browsing as a guest</strong>
                    <p>You can browse and send a claim without creating an account.</p>
                    <Link to="/sign-in" onClick={() => accountRef.current?.removeAttribute("open")}>
                      Sign in <ArrowUpRight size={14} />
                    </Link>
                    <Link to="/sign-up" onClick={() => accountRef.current?.removeAttribute("open")}>
                      Create an account <ArrowUpRight size={14} />
                    </Link>
                  </>
                )}
              </div>
            </details>
          </div>
          <div className="mobile-header-tools">
            <NotificationCenter />
            <ThemeToggle />
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
