/**
 * Footer simple du POC. 4 colonnes minimales façon Imba.
 */

export function PocFooter() {
  return (
    <footer className="mt-32 border-t border-white/5 px-6 py-12 lg:px-12">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="poc-kicker mb-3">Hello</p>
          <p className="max-w-xs text-sm text-zinc-400 leading-relaxed">
            Ignissimos ducimus qui blanditiis prae sentium voluptatum deleniti.
          </p>
        </div>
        <div>
          <p className="poc-kicker mb-3">Office</p>
          <p className="text-sm text-zinc-300">Germany —</p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            785 15th Street, Office 478<br />
            Berlin, De 81566
          </p>
          <p className="poc-mono mt-2 text-xs text-[var(--poc-accent-400)]">info@email.com</p>
          <p className="poc-mono text-xs text-zinc-300">+1 840 841 25 69</p>
        </div>
        <div>
          <p className="poc-kicker mb-3">Links</p>
          <ul className="space-y-1 text-sm text-zinc-300">
            <li>Home</li>
            <li className="text-[var(--poc-accent-400)]">Services</li>
            <li>About Us</li>
            <li>Features</li>
            <li>Contacts</li>
          </ul>
        </div>
        <div>
          <p className="poc-kicker mb-3">Get In Touch</p>
          <ul className="space-y-1 text-sm text-zinc-300">
            <li>Facebook</li>
            <li>Twitter</li>
            <li>Dribble</li>
            <li>Instagram</li>
          </ul>
        </div>
      </div>
      <p className="poc-mono mx-auto mt-12 max-w-[1600px] text-xs text-zinc-500">
        © Copyright 2026 — Gamers Universe — Design POC. Inspired by Imba theme.
      </p>
    </footer>
  );
}
