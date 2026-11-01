import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { SiteSearch } from "@/components/layout/SiteSearch";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="mobile-menu-trigger" type="button" aria-label="Open navigation">
          <Menu size={20} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="mobile-drawer-overlay" />
        <Dialog.Content className="mobile-drawer">
          <div className="mobile-drawer-header">
            <Link className="brand" to="/" aria-label="Common Ground home">
              <span className="brand-wordmark">
                common<span>ground</span>
              </span>
            </Link>
            <Dialog.Close asChild>
              <button className="mobile-drawer-close" type="button" aria-label="Close navigation">
                <X size={19} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Title className="mobile-drawer-title">Where would you like to go?</Dialog.Title>
          <Dialog.Description className="mobile-drawer-description">
            Browse nearby listings or let the neighborhood know what you found.
          </Dialog.Description>
          <SiteSearch onNavigate={() => setOpen(false)} />
          <nav className="mobile-drawer-nav" aria-label="Mobile navigation">
            <NavLink to="/items" onClick={() => setOpen(false)}>
              Browse items
            </NavLink>
            <NavLink to="/report/lost" onClick={() => setOpen(false)}>
              Report a lost item
            </NavLink>
            <NavLink to="/report/found" onClick={() => setOpen(false)}>
              Report a found item
            </NavLink>
            <NavLink to="/how-it-works" onClick={() => setOpen(false)}>
              How it works
            </NavLink>
          </nav>
          <div className="mobile-drawer-footer">
            <p>Browsing as a guest. No account is needed to look around or send a claim.</p>
            <Link className="text-link" to="/faq" onClick={() => setOpen(false)}>
              Account &amp; claim questions
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
