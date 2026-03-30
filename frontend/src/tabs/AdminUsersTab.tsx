import React from "react";

type UserRow = {
  id: number;
  name: string;
  isAdmin: boolean;
  team: { id: number; color: string } | null;
};

type TeamRow = {
  id: number;
  color: string;
  contestId: number;
};

export function AdminUsersTab() {
  const [users, setUsers] = React.useState<UserRow[] | null>(null);
  const [teams, setTeams] = React.useState<TeamRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const [usersRes, teamsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/teams"),
        ]);

        if (usersRes.status === 401) {
          throw new Error("ログインが必要です");
        }
        if (usersRes.status === 403) {
          throw new Error("管理者のみユーザ一覧を参照できます");
        }
        if (!usersRes.ok) {
          throw new Error(`Failed to load users: ${usersRes.status}`);
        }
        if (!teamsRes.ok) {
          throw new Error(`Failed to load teams: ${teamsRes.status}`);
        }

        const usersBody = (await usersRes.json()) as { users: UserRow[] };
        const teamsBody = (await teamsRes.json()) as { teams: TeamRow[] };

        if (!cancelled) {
          setUsers(usersBody.users);
          setTeams(teamsBody.teams);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setUsers(null);
          setTeams(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function updateUserTeam(userId: number, teamId: number | null) {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = body && typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const updated = body as UserRow;
      setUsers((prev) =>
        prev
          ? prev.map((u) => (u.id === updated.id ? { ...u, team: updated.team } : u))
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div style={{ color: "#b00020" }}>Error: {error}</div>;
  }

  if (!users || users.length === 0) {
    return <div>ユーザがいません。</div>;
  }

  return (
    <div className="problem-view">
      <h2>ユーザ / チーム管理</h2>
      {isSaving && <div>保存中...</div>}
      <table className="submissions-table" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ユーザ名</th>
            <th>ロール</th>
            <th>チーム</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.isAdmin ? "admin" : "user"}</td>
              <td>
                {teams && (
                  <select
                    value={u.team ? String(u.team.id) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const nextTeamId = value === "" ? null : Number(value);
                      void updateUserTeam(u.id, nextTeamId);
                    }}
                  >
                    <option value="">未所属</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.id} ({t.color})
                      </option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
