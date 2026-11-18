import type { ReactNode } from "react";

export function AdminPage({ title, subtitle, action, children }: { title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}
