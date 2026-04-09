import React from "react";
import { trpc } from "../utils/trpc";

export function UserTab() {
  const { data: user, isLoading, error: loadError, refetch } = trpc.me.useQuery();
  const [nameInput, setNameInput] = React.useState("");
  const [passwordInput, setPasswordInput] = React.useState("");
  const [regNameInput, setRegNameInput] = React.useState("");
  const [regPasswordInput, setRegPasswordInput] = React.useState("");
  const [authMessage, setAuthMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const registerMutation = trpc.register.useMutation();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput, password: passwordInput }),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("ユーザ名またはパスワードが違います");
        throw new Error("ログインに失敗しました");
      }
      setAuthMessage("ログインしました");
      setPasswordInput("");
      await refetch();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthMessage(null);
    setError(null);
    try {
      await registerMutation.mutateAsync({ name: regNameInput, password: regPasswordInput });
      setAuthMessage("ユーザ登録しました。ログインしてください。");
      setRegNameInput("");
      setRegPasswordInput("");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
      setAuthMessage("ログアウトしました");
      await refetch();
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (isLoading) return <div>Loading user...</div>;

  return (
    <div className="problem-view">
      <h2>ユーザ</h2>
      {(error || loadError) && <div style={{ color: "#b00020" }}>Error: {error || loadError?.message}</div>}
      {authMessage && <div className="submit-message">{authMessage}</div>}

      {user ? (
        <div style={{ marginTop: 16 }}>
          <p>ログイン中: <strong>{user.name}</strong></p>
          <p>ロール: {user.isAdmin ? "管理者" : "一般ユーザ"}</p>
          <p>所属チーム: {user.teams.length > 0 ? (
            <ul>
              {user.teams.map((t) => (
                <li key={t.id}>コンテスト #{t.contestId}: #{t.id} ({t.color})</li>
              ))}
            </ul>
          ) : " 未所属"}</p>
          <button onClick={handleLogout} style={{ marginTop: 16 }}>ログアウト</button>
        </div>
      ) : (
        <>
          <form className="submit-form" onSubmit={handleLogin} style={{ marginTop: 16 }}>
            <h3>ログイン</h3>
            <div className="form-row">
              <label>ユーザ名: <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} /></label>
            </div>
            <div className="form-row">
              <label>パスワード: <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} /></label>
            </div>
            <div className="form-row"><button type="submit" disabled={!nameInput || !passwordInput}>ログイン</button></div>
          </form>

          <form className="submit-form" onSubmit={handleRegister} style={{ marginTop: 32 }}>
            <h3>新規登録</h3>
            <div className="form-row">
              <label>ユーザ名: <input type="text" value={regNameInput} onChange={(e) => setRegNameInput(e.target.value)} /></label>
            </div>
            <div className="form-row">
              <label>パスワード: <input type="password" value={regPasswordInput} onChange={(e) => setRegPasswordInput(e.target.value)} /></label>
            </div>
            <div className="form-row">
              <button type="submit" disabled={!regNameInput || !regPasswordInput || registerMutation.isPending}>
                {registerMutation.isPending ? "登録中..." : "登録"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
