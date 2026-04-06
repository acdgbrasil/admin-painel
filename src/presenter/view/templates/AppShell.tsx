import { Avatar } from "../atoms/Avatar";
import type { SessionInfo } from "../../../data/model/session";

interface Props {
  readonly session: SessionInfo;
  readonly activePath: string;
  readonly children: string;
}

const NavItem = (p: { label: string; href: string; active: boolean }): string => (
  <a
    href={p.href}
    class={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${p.active ? "font-bold" : "font-medium"}`}
    style={p.active ? "background:rgba(38,29,17,0.09);color:#261D11;" : "color:rgba(38,29,17,0.55);"}
  >
    {p.label}
  </a>
) as unknown as string;

export const AppShell = (props: Props): string => (
  <div>
    {/* Navbar */}
    <nav
      class="fixed top-0 left-0 right-0 h-[60px] z-30 flex items-center justify-between px-6"
      style="background:#FAF0E0;border-bottom:1px solid rgba(38,29,17,0.08);"
    >
      <div class="flex items-center gap-3">
        <button data-action="toggle-sidebar" class="md:hidden p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:#172D48;">
          <span class="text-xs font-bold" style="color:#F2E2C4;">CR</span>
        </div>
        <span class="text-[15px] font-bold" style="color:#261D11;">Conecta Raros</span>
        <span class="px-2 py-0.5 rounded-full text-[11px] font-medium" style="background:rgba(38,29,17,0.08);color:rgba(38,29,17,0.6);">
          admin
        </span>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-[13px] font-semibold" style="color:#261D11;">{props.session.name as "safe"}</p>
          <p class="text-[12px] font-editorial italic" style="color:rgba(38,29,17,0.5);">
            {(props.session.roles.join(", ") || "Admin") as "safe"}
          </p>
        </div>
        {Avatar({ name: props.session.name })}
      </div>
    </nav>

    {/* Sidebar */}
    <aside
      id="sidebar"
      class="fixed top-[60px] left-0 bottom-0 w-[220px] z-20 flex flex-col py-6 px-3 transition-transform duration-300 md:translate-x-0 -translate-x-full"
      style="background:#FAF0E0;border-right:1px solid rgba(38,29,17,0.08);"
    >
      <div class="mb-2 px-4">
        <span class="text-[11px] font-bold uppercase tracking-widest" style="color:rgba(38,29,17,0.35);">Gestão</span>
      </div>
      {NavItem({ label: "Usuários", href: "/users", active: props.activePath.startsWith("/users") })}
      {NavItem({ label: "Projetos & Roles", href: "/projects", active: props.activePath.startsWith("/projects") })}

      <div class="mt-6 mb-2 px-4">
        <span class="text-[11px] font-bold uppercase tracking-widest" style="color:rgba(38,29,17,0.35);">Sistema</span>
      </div>
      {NavItem({ label: "Auditoria", href: "#", active: false })}
      {NavItem({ label: "Configuraç��es", href: "#", active: false })}

      <div class="mt-auto px-3">
        <a href="/auth/logout" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium" style="color:#A6290D;">
          Sair
        </a>
      </div>
    </aside>

    {/* Content */}
    <main class="pt-[60px] md:ml-[220px] min-h-screen">
      <div class="p-6 lg:p-8">{props.children as "safe"}</div>
    </main>
  </div>
) as unknown as string;
