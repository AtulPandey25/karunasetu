import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useCart } from "../hooks/use-cart";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const hideDonate =
    location.pathname.startsWith("/celebration") ||
    location.pathname.startsWith("/gallery") ||
    location.pathname.startsWith("/admin");

  useEffect(() => {
    function onClickAnchor(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      e.preventDefault();
      const targetId = anchor.getAttribute("href")!;
      const el = document.querySelector(targetId) as HTMLElement | null;
      if (el) {
        setMobileOpen(false);
        window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
      }
    }

    document.addEventListener("click", onClickAnchor);
    return () => document.removeEventListener("click", onClickAnchor);
  }, []);

  useEffect(() => {
    function checkVisibility() {
      const elements = document.querySelectorAll(".animate-fade-in");
      elements.forEach((element) => {
        const el = element as HTMLElement;
        const elementTop = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (elementTop < windowHeight - 100) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      });
    }
    checkVisibility();
    window.addEventListener("scroll", checkVisibility);
    return () => window.removeEventListener("scroll", checkVisibility);
  }, []);

  useEffect(() => {
    function onScroll() {
      const header = document.querySelector("header");
      if (!header) return;
      if (window.scrollY > 10) header.classList.add("shadow-lg");
      else header.classList.remove("shadow-lg");
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 inset-x-0 z-40 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-primary"
          >
            <span className="inline-block h-8 w-8 rounded bg-primary text-primary-foreground grid place-items-center">
              KS
            </span>
            <span>KarunaSetu Foundation</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <NavItem to="/">Home</NavItem>
            {!hideDonate && (
              <a href="#donate" className="hover:text-primary">
                Donate
              </a>
            )}
            <NavItem to="/celebration">Celebration</NavItem>
            <NavItem to="/gallery">Gallery</NavItem>
            <NavItem to="/admin">Admin</NavItem>
            <CartIcon />
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <CartIcon />
            <button
              id="mobile-menu-button"
              onClick={() => setMobileOpen((s) => !s)}
              className="p-2 rounded-md text-gray-600 hover:bg-muted"
            >
              {/* Hamburger Icon */}
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div
          id="mobile-menu"
          className={`md:hidden ${mobileOpen ? "" : "hidden"} bg-white shadow-lg`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-primary hover:bg-gray-50"
            >
              Home
            </Link>
            {/* Show these links only on the homepage */}
            {location.pathname === "/" && (
              <>
                <a
                  href="#about"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-primary hover:bg-gray-50"
                >
                  About Us
                </a>
                <a
                  href="#achievements"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-primary hover:bg-gray-50"
                >
                  Our Work
                </a>
                <a
                  href="#contact"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-primary hover:bg-gray-50"
                >
                  Contact Us
                </a>
              </>
            )}
            {/* Show Donate button only on the homepage */}
            {location.pathname === "/" && !hideDonate && (
              <a
                href="#donate"
                className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary hover:bg-indigo-700"
              >
                Donate
              </a>
            )}
            <Link
              to="/celebration"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-primary hover:bg-gray-50"
            >
              Celebration
            </Link>
            <Link
              to="/gallery"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-primary hover:bg-gray-50"
            >
              Gallery
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-primary hover:bg-gray-50"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <footer id="contact" className="border-t bg-card text-card-foreground">
        <div className="container py-10 grid gap-6 md:grid-cols-3">
          <div>
            <div className="font-semibold">KarunaSetu Foundation</div>
            <p className="text-sm text-muted-foreground mt-2">
              Bridging compassion to create sustainable change in communities.
            </p>
          </div>
          <div>
            <div className="font-semibold mb-2">Quick Links</div>
            <ul className="space-y-1 text-sm">
              <li>
                <Link to="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <a href="#about" className="hover:text-primary">
                  About
                </a>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-primary">
                  Gallery
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Contact</div>
            <p className="text-sm text-muted-foreground">
              Email: foundationkarunasetu@gmail.com
            </p>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} KarunaSetu Foundation
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "hover:text-primary transition-colors",
          isActive && "text-primary font-medium",
        )
      }
    >
      {children}
    </NavLink>
  );
}

function CartIcon() {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
